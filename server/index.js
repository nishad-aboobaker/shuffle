require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const Student = require('./models/Student');
const BatchState = require('./models/BatchState');
const SessionLog = require('./models/SessionLog');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1 && !process.env.ALLOW_ALL_ORIGINS) {
            // For dev simplicity, you might want to uncomment this line to allow all:
            // return callback(null, true);
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            // return callback(new Error(msg), false);
            return callback(null, true); // Permissive for now to avoid deployment frustration
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/morning_session', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- EMAIL SERVICE (BREVO HTTP API) ---
// We use HTTP API to avoid Port blocking on Cloud Servers (SMTP 587/465 often blocked)
async function sendEmail({ to, subject, htmlContent, textContent }) {
    const url = 'https://api.brevo.com/v3/smtp/email';
    const apiKey = process.env.EMAIL_PASS; // This must be the Brevo API Key
    const senderEmail = process.env.EMAIL_USER;

    if (!apiKey || !senderEmail) {
        console.error('Email configuration missing');
        return;
    }

    const payload = {
        sender: { name: "Morning Session App", email: senderEmail },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
        textContent: textContent
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Brevo API Error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        console.log(`Email sent to ${to}: ${data.messageId}`);
        return data;
    } catch (error) {
        console.error('Email Send Failed:', error.message);
        // Don't throw to prevent crashing the main session generation loop
    }
}

app.post('/api/test-email', async (req, res) => {
    try {
        const result = await sendEmail({
            to: process.env.EMAIL_USER,
            subject: "Test Email from Render (API Mode)",
            textContent: "If you see this, the HTTP API is working!"
        });
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



/* --- API ROUTES --- */

// 1. Get All Students
app.get('/api/students', async (req, res) => {
    try {
        const students = await Student.find({ deleted: false });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Add Student
app.post('/api/students', async (req, res) => {
    try {
        const { name, email, batch } = req.body;
        const newStudent = new Student({ name, email, batch });
        await newStudent.save();
        res.status(201).json(newStudent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 3. Delete Student (Soft)
app.delete('/api/students/:id', async (req, res) => {
    try {
        await Student.findByIdAndUpdate(req.params.id, { deleted: true });
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. GENERATE SESSION (The Core Logic)
app.post('/api/session/generate', async (req, res) => {
    const { batch, activities } = req.body;
    // activities = [ { name: "News", count: 2 }, { name: "Intro", count: 1 } ]

    try {
        // A. Get Batch State
        let batchState = await BatchState.findOne({ batch });
        if (!batchState) {
            batchState = new BatchState({ batch, activityCycles: {} });
        }

        // Ensure activityCycles is initialized (if migrating from old schema)
        if (!batchState.activityCycles) {
            batchState.activityCycles = new Map();
        }

        // B. Get All Eligible Students in Batch
        const allStudents = await Student.find({ batch, deleted: false });
        if (allStudents.length === 0) {
            return res.status(400).json({ error: 'No students found in this batch.' });
        }

        const allStudentIds = allStudents.map(s => s._id.toString());

        let assignments = [];
        let assignedStudentIdsThisSession = []; // To prevent one student getting 2 roles in same session

        // C. Iterate through requested activities and assign
        for (const act of activities) {
            const activityName = act.name.trim(); // Case sensitive key? better to normalize?
            // Let's keep it exact match for now, or normalize to LowerCase if consistency needed.
            const activityKey = activityName.toLowerCase();

            for (let i = 0; i < act.count; i++) {
                // 1. Get History for this activity
                let historyForActivity = batchState.activityCycles.get(activityKey) || [];

                // 2. Define Eligible Pool
                // Eligible = (All Students) - (Assigned This Session) - (In History for this Activity)
                let eligibleIds = allStudentIds.filter(id =>
                    !assignedStudentIdsThisSession.includes(id) &&
                    !historyForActivity.includes(id)
                );

                // 3. Handle Empty Pool (End of Cycle)
                if (eligibleIds.length === 0) {
                    // Cycle Finished! Reset history for this activity.
                    // But we still exclude those assigned *this session* to prevent duplicates today.
                    historyForActivity = [];
                    batchState.activityCycles.set(activityKey, []); // Reset in DB object

                    // Re-calc eligible with fresh history
                    eligibleIds = allStudentIds.filter(id => !assignedStudentIdsThisSession.includes(id));
                }

                if (eligibleIds.length === 0) {
                    // Still empty? Means literally everyone is assigned TODAY? Or purely impossible.
                    console.warn(`Not enough students to fill ${activityName}`);
                    continue; // Skip slot
                }

                // 4. Pick Random
                const randomId = eligibleIds[Math.floor(Math.random() * eligibleIds.length)];

                // 5. Assign
                const student = allStudents.find(s => s._id.toString() === randomId);
                assignments.push({
                    studentName: student.name,
                    studentEmail: student.email,
                    activity: activityName
                });

                // 6. Update State
                assignedStudentIdsThisSession.push(randomId);

                // Add to history (make sure we work with the array reference or set it back)
                // Maps in Mongoose can be tricky. Best to get, push, set.
                let updatedHistory = batchState.activityCycles.get(activityKey) || [];
                updatedHistory.push(randomId);
                batchState.activityCycles.set(activityKey, updatedHistory);
            }
        }

        await batchState.save();

        // G. Send Emails (Async - don't block response too long, or await if critical)
        // 1. Host Summary Construction
        const hostHtml = `
      <h2>Morning Session: ${new Date().toLocaleDateString()}</h2>
      <ul>
        ${assignments.map(a => `<li><b>${a.activity}</b>: ${a.studentName}</li>`).join('')}
      </ul>
    `;

        // Plain text for WhatsApp


        // Check if a student was assigned "Host" activity
        const hostAssignment = assignments.find(a => a.activity.toLowerCase() === 'host');

        // Send Summary to the Student Host (if exists)
        if (hostAssignment) {
            sendEmail({
                to: hostAssignment.studentEmail,
                subject: `[HOST DUTY] Morning Session Schedule - ${new Date().toLocaleDateString()}`,
                htmlContent: `<p>Hi <b>${hostAssignment.studentName}</b>,</p>
                       <p>You have been selected as the <b>Host</b>. Here is the schedule for tomorrow:</p>
                       ${hostHtml}`
            });
        }

        // Send to Static Teacher/Admin Host (Backup/Supervisor)
        if (process.env.HOST_EMAIL) {
            sendEmail({
                to: process.env.HOST_EMAIL,
                subject: `[ADMIN] Morning Session Schedule - ${new Date().toLocaleDateString()}`,
                htmlContent: hostHtml
            });
        }

        // 2. Student Emails
        assignments.forEach(a => {
            // Skip sending generic email if the student is the Host (they already got one)
            if (a.activity.toLowerCase() === 'host') return;

            sendEmail({
                to: a.studentEmail,
                subject: `Morning Session Assignment: ${a.activity}`,
                textContent: `Hi ${a.studentName},\n\nYou have been selected for ${a.activity} in the upcoming morning session.\n\nGood luck!`,
                htmlContent: `<p>Hi <b>${a.studentName}</b>,</p><p>You have been selected for <b>${a.activity}</b> in the upcoming morning session.</p>`
            });
        });

        // H. Log Session
        // "Round" calculation: Count previous sessions for this batch + 1
        console.log(`[DEBUG] Calculating round for batch: "${batch}"`);
        const previousSessionCount = await SessionLog.countDocuments({ batch });
        console.log(`[DEBUG] Found ${previousSessionCount} previous logs. Setting round to ${previousSessionCount + 1}`);
        const roundForTheseSelections = previousSessionCount + 1;

        const log = new SessionLog({
            batch,
            round: roundForTheseSelections,
            assignments
        });
        await log.save();

        res.json({ success: true, assignments, round: roundForTheseSelections });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Get History
app.get('/api/history', async (req, res) => {
    try {
        const logs = await SessionLog.find().sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
