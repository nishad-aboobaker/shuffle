require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Student = require('./models/Student');
const BatchState = require('./models/BatchState');
const SessionLog = require('./models/SessionLog');
const Admin = require('./models/Admin');
const Otp = require('./models/Otp');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1 && !process.env.ALLOW_ALL_ORIGINS) {
            return callback(null, true);
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
async function sendEmail({ to, subject, htmlContent, textContent }) {
    const url = 'https://api.brevo.com/v3/smtp/email';
    const apiKey = process.env.EMAIL_PASS;
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
    }
}

/* --- AUTH ROUTES --- */

// 1. Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    try {
        // Check if user exists
        let admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Generate and Hash OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Save to DB (Upsert to replace old OTP if exists)
        await Otp.findOneAndUpdate(
            { email },
            { otp: hashedOtp, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        // Send Email
        await sendEmail({
            to: email,
            subject: 'Verify Your Email - Morning Session Manager',
            htmlContent: `<h2>Verification Code</h2><p>Your OTP is: <b>${otp}</b></p><p>This code expires in 5 minutes.</p>`
        });

        res.json({ success: true, msg: 'OTP sent to email' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error sending OTP' });
    }
});

// 2. Register (Verify OTP & Create)
app.post('/api/auth/register', async (req, res) => {
    const { instituteName, email, password, otp } = req.body;
    try {
        // Verify OTP
        const otpDoc = await Otp.findOne({ email });
        if (!otpDoc) {
            return res.status(400).json({ msg: 'OTP expired or invalid. Please request a new one.' });
        }

        const isMatch = await bcrypt.compare(otp, otpDoc.otp);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid verification code.' });
        }

        // Check if user exists (Double check)
        let admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create Admin
        admin = new Admin({ instituteName, email, password });

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);

        await admin.save();

        // Delete used OTP
        await Otp.deleteOne({ email });


        const payload = { user: { id: admin.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: 36000 }, (err, token) => {
            if (err) throw err;
            res.json({ token, instituteName: admin.instituteName });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login Admin
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = { user: { id: admin.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: 36000 }, (err, token) => {
            if (err) throw err;
            res.json({ token, instituteName: admin.instituteName });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

/* --- API ROUTES (PROTECTED) --- */

// 1. Get All Students (Scoped to Admin)
app.get('/api/students', auth, async (req, res) => {
    try {
        const students = await Student.find({ deleted: false, adminId: req.user.id });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Add Student (Scoped to Admin)
app.post('/api/students', auth, async (req, res) => {
    try {
        const { name, email, batch } = req.body;
        const newStudent = new Student({
            name,
            email,
            batch,
            adminId: req.user.id
        });
        await newStudent.save();
        res.status(201).json(newStudent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 3. Delete Student (Soft)
app.delete('/api/students/:id', auth, async (req, res) => {
    try {
        // Ensure student belongs to admin
        const student = await Student.findOne({ _id: req.params.id, adminId: req.user.id });
        if (!student) return res.status(404).json({ msg: 'Student not found or unauthorized' });

        student.deleted = true;
        await student.save();
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. GENERATE SESSION
app.post('/api/session/generate', auth, async (req, res) => {
    const { batch, activities } = req.body;

    try {
        // A. Handle "All Batches" Mode
        // We use a special internal ID for the state of the "All Institute" pool
        const stateKey = batch === 'ALL' ? '_ALL_INSTITUTE_' : batch;

        // B. Get Batch State (Scoped)
        let batchState = await BatchState.findOne({ batch: stateKey, adminId: req.user.id });
        if (!batchState) {
            batchState = new BatchState({
                batch: stateKey,
                adminId: req.user.id,
                activityCycles: {}
            });
        }
        if (!batchState.activityCycles) batchState.activityCycles = new Map();

        // C. Get All Eligible Students (Scoped)
        let studentQuery = { deleted: false, adminId: req.user.id };
        if (batch !== 'ALL') {
            studentQuery.batch = batch;
        }

        const allStudents = await Student.find(studentQuery);
        if (allStudents.length === 0) {
            return res.status(400).json({ error: 'No students found.' });
        }

        const allStudentIds = allStudents.map(s => s._id.toString());
        let assignments = [];
        let assignedStudentIdsThisSession = [];

        // C. Assignment Logic (Same as before)
        for (const act of activities) {
            const activityName = act.name.trim();
            const activityKey = activityName.toLowerCase();

            for (let i = 0; i < act.count; i++) {
                let historyForActivity = batchState.activityCycles.get(activityKey) || [];
                let eligibleIds = allStudentIds.filter(id =>
                    !assignedStudentIdsThisSession.includes(id) &&
                    !historyForActivity.includes(id)
                );

                if (eligibleIds.length === 0) {
                    historyForActivity = [];
                    batchState.activityCycles.set(activityKey, []);
                    eligibleIds = allStudentIds.filter(id => !assignedStudentIdsThisSession.includes(id));
                }

                if (eligibleIds.length === 0) {
                    console.warn(`Not enough students to fill ${activityName}`);
                    continue;
                }

                const randomId = eligibleIds[Math.floor(Math.random() * eligibleIds.length)];
                const student = allStudents.find(s => s._id.toString() === randomId);
                assignments.push({
                    studentName: student.name,
                    studentEmail: student.email,
                    activity: activityName
                });

                assignedStudentIdsThisSession.push(randomId);
                let updatedHistory = batchState.activityCycles.get(activityKey) || [];
                updatedHistory.push(randomId);
                batchState.activityCycles.set(activityKey, updatedHistory);
            }
        }

        await batchState.save();

        // H. Log Session (Scoped)
        const lastSession = await SessionLog.findOne({ batch, adminId: req.user.id }).sort({ round: -1 });
        const roundForTheseSelections = (lastSession ? lastSession.round : 0) + 1;

        const log = new SessionLog({
            batch,
            round: roundForTheseSelections,
            assignments,
            adminId: req.user.id
        });
        await log.save();

        // Send immediate response to user for better performance
        res.json({ success: true, assignments, round: roundForTheseSelections });

        // G. Send Emails (Processed in background)
        const hostHtml = `
      <h2>Morning Session: ${new Date().toLocaleDateString()}</h2>
      <ul>
        ${assignments.map(a => `<li><b>${a.activity}</b>: ${a.studentName}</li>`).join('')}
      </ul>
    `;

        const hostAssignment = assignments.find(a => a.activity.toLowerCase() === 'host');
        if (hostAssignment) {
            sendEmail({
                to: hostAssignment.studentEmail,
                subject: `[HOST DUTY] Morning Session - ${new Date().toLocaleDateString()}`,
                htmlContent: `<p>Hi <b>${hostAssignment.studentName}</b>,</p>
                       <p>You are the <b>Host</b>.</p>
                       ${hostHtml}`
            });
        }

        // Send to Admin (The User)
        const adminUser = await Admin.findById(req.user.id);
        if (adminUser && adminUser.email) {
            sendEmail({
                to: adminUser.email,
                subject: `[ADMIN] Session Schedule - ${new Date().toLocaleDateString()}`,
                htmlContent: hostHtml
            });
        }

        assignments.forEach(a => {
            if (a.activity.toLowerCase() === 'host') return;
            sendEmail({
                to: a.studentEmail,
                subject: `assignment: ${a.activity}`,
                textContent: `Hi ${a.studentName}, You have been selected for ${a.activity}.`,
                htmlContent: `<p>Hi <b>${a.studentName}</b>,</p><p>You are selected for <b>${a.activity}</b>.</p>`
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Get History (Scoped)
app.get('/api/history', auth, async (req, res) => {
    try {
        const logs = await SessionLog.find({ adminId: req.user.id }).sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
