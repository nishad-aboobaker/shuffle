# Morning Session Manager

A modern, professional web application for managing morning session activities in educational institutions. Automates student selection for various activities using a fair round-robin algorithm and sends automated email notifications.

## ✨ Features

### Core Functionality
- **Automated Activity Assignment** - Fair round-robin algorithm ensures equal participation
- **Multi-Batch Support** - Manage multiple classes/batches or run sessions for entire institute
- **Custom Activities** - Add your own activities beyond the default options
- **Email Notifications** - Automated emails sent to selected students via Brevo API
- **Session History** - Complete tracking of all past sessions and assignments

### User Management
- **Multi-Tenant Architecture** - Each institution has isolated data
- **Secure Authentication** - JWT-based auth with OTP email verification
- **Student Management** - Easy add/remove students with batch organization

### Professional Design
- **Clean Light Theme** - Modern, professional interface without gradients
- **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- **Intuitive UX** - Simple navigation with Session, Students, and History tabs

## 🚀 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Brevo API** for email delivery
- **bcrypt.js** for password hashing

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (Atlas or local instance)
- **Brevo Account** (for email functionality)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd shuffle
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_brevo_api_key
EMAIL_PASS=your_brevo_api_key
PORT=5000
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory (if needed):
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔑 Environment Variables

### Backend (`server/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `you-mongodb-atlas-connection-string-here` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key-here` |
| `EMAIL_USER` | Brevo API key | `your-brevo-api-key` |
| `EMAIL_PASS` | Brevo API key (same as above) | `your-brevo-api-key` |
| `PORT` | Server port (optional) | `5000` |

### Frontend (`client/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |

## 📖 Usage

### First Time Setup
1. **Register** your institution at `/register`
2. **Verify** your email with the OTP sent to your inbox
3. **Login** with your credentials

### Managing Students
1. Navigate to the **Students** tab
2. Add students with their name, email, and batch
3. Edit or delete students as needed

### Running a Session
1. Go to the **Session** tab
2. Select a batch (or "All Batches")
3. Check activities you want to include
4. Adjust student counts per activity
5. Add custom activities if needed
6. Click **Generate & Send Emails**

### Viewing History
1. Click the **History** tab
2. View all past sessions with details
3. See which students were assigned to each activity

## 🗂️ Project Structure

```
shuffle/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React Context (Auth)
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── public/            # Static assets
│   └── package.json
│
├── server/                # Backend Node.js application
│   ├── models/           # MongoDB models
│   ├── utils/            # Utility functions (email)
│   ├── index.js          # Main server file
│   └── package.json
│
└── README.md
```

## 🔐 Security Features

- **Password Hashing** - bcrypt with salt rounds
- **OTP Verification** - Email verification during registration
- **JWT Tokens** - Secure authentication with httpOnly cookies
- **Data Isolation** - Multi-tenant architecture with admin-scoped data
- **Auto-expiring OTPs** - 5-minute TTL on verification codes

## 🎯 Default Activities

1. **Host** - Session coordinator (1 student)
2. **News Report** - Current events presentation (2 students)
3. **Topic Presentation** - Subject presentation (1 student)
4. **Self Introduction** - New student introduction (1 student)
5. **Thought of the Day** - Inspirational quote (1 student)

You can customize counts and add your own activities!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Known Issues

None at the moment. Please report any issues you encounter!

## 📞 Support

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for educational institutions**
