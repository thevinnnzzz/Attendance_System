# Attendance System

A school attendance management system with email notifications for absent/late students.

## Local Setup

### Prerequisites

- Node.js >= 20

### 1. Install Dependencies

```bash
# Install root dependencies (Vite frontend + Express server)
npm install

# Install backend dependencies (standalone API server)
cd backend
npm install
cd ..
```

> **Windows users:** If `npm install` is blocked by execution policy errors, run this in PowerShell first:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

### 2. Create `firebase-service-account.json`

Create a file named `firebase-service-account.json` in the project root with the following contents:

```json
{
  "type": "service_account",
  "project_id": "attendancesystem-b8cff",
  "private_key_id": "d88bf592db33a3aaeea296bb6899d3ecebcaede5",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDwOZsxR0JPZes2\n00AcpY6yI+scmua4P9lq9bH+Q17YqXrw44fK1Jscua/7zImxzna7k/PFUjDVvZb+\nKlvmfTELPLnyziWyQR0TERyXErjFRprKsLG/CApo/BK2mSt6xigIPjGJiBhIyV47\nz7Pk0656wASyeRFW52EkwWbuwuDHifvbhYHx0J5DbEBIMr9HzNWnjxPgpiVwNRNx\n8m62SJPvWOrEd40iS7nA44Qk8viwOVD/V//yh4D//yvDO3eLLBvsM4FKJgZJXqqn\nJd31meIaMF2RHu8UGu6zWzde2d52ZseecXDqLaouODXEZhAoUrrQmgIyQ2yspm9G\n40fG3i0hAgMBAAECggEAT+qyLO4qarSa0CXuNbmEI9JcNKt5pwEiyPkM6mwqQQT8\n7+eZ9MnPAnrpx2hvxHXNvTCGz/W8ZlcIxOx9n0u1xanBqLuZAdi0nfO64a1qR8Lp\n2xV2RHmd0PhPF20UcGc8ySU7oKfkgE5xaY97JtyfNpnr1h39vT4DbNFkd3jgg7DI\nTHWcIoueYBCD5pSGgb4olVMmHdJnZqFOp/k6wkO/U5GRpvURV9UXs6VUPP69FE10\ndtiS40bs96Fj30xqbh7lj+RV/GjDtl0q3709J6KukkTskyBvTzF+DOjijW/vH9di\nSFo48bMEXlSAOSCfKa+GYsRf9xLItAKvrAGaf/h8awKBgQD9qVVdOkei91hywiy0\noo/fsv9NVmfuLQpWqqag/ozkEaGuMpuEoIbtRaF5Si0zri9t6aCvM5Khwz7HVc91\nOsFuHzOXYcdt8egxvSlvjDDmw3pUAn29BKpOrNsZKbBJhEUYUnQYw5oeUCHlVuP0\nptYHnGWM8ssvodQjIutV8YGNxwKBgQDycI+56XVHpVnxVbaDdxRLkJVlCWN5y/ZH\nFmDXlLOVhovLmhN/ckU2Vi1WTyzEfCcUcBYQGnTcP5U9wnJSzDTVuayE6fChx9C6\ngTB9XEpi3FId3qxYWUZICiEiJKvYJYl2hEeVhp5fGRLQgupRcaOujn7/d4EeK3EA\nwY03vjsN1wKBgBi3kVveO/DDTVkRVq3bUU2o8XulucbZmLJNOqNhanUmyqxgvgq0\nYbFpIYziD3mDtZduNnwb+GPO1KUz1V1E9mg2nh5YJsit08RU/F6kOHekAJ2DCKGM\nfNPhwA+5ojXnr5vpHOr01GWzxTnFt7y1LRHcyYBsgCQKDtPFqUzclZUtAoGASqTh\ne6onk+GTKbzsLtnxA7sGZE9Zs1xa/VQkiPudt0HvtMZBjpHOQYaS+unxrKVVGvPP\ntzGOHWnuN0+xB1EcS1mZhmrIzebJm0K/fTl3Ja0UE2JFygXin7eOsAZ+alRUWIst\nxxnllP4RTuWf42eLr+jrrRhMRs+1QThWlH0bjY0CgYEAhHZ668ZK36/0eUSN/Bm7\nZEumHzymkFvtQ5G5j0dYLT9fXu6QL/gSshCC8RGVFe2f+d5KOKXvNtt4l3ktEnPf\nQh4JjYC4qZvpGKQ4Hq849KjY6+shvtksEKVqQ047t0dxWz81LffYJbw31laXzxZ5\nXdcgH2gvg/kirb8H2QcGsNE=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@attendancesystem-b8cff.iam.gserviceaccount.com",
  "client_id": "110235086573202413565",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40attendancesystem-b8cff.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

### 3. Create `.env`

Create a file named `.env` in the project root with the following contents:

```bash
# GEMINI_API_KEY: Required for Gemini AI API calls.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this applet is hosted.
APP_URL="MY_APP_URL"

# GMAIL_SMTP_USER: The email address for sending notifications (e.g., your school email).
GMAIL_SMTP_USER="miketanny893@gmail.com"

# GMAIL_SMTP_PASS: The App Password generated for the Gmail account.
GMAIL_SMTP_PASS="acjy mvoh fbac zibf"

# Firebase Client Configuration
VITE_FIREBASE_API_KEY="AIzaSyBa6jCO-aPjn-8ipv23-Y4ZUxBD0Ou16C8"
VITE_FIREBASE_AUTH_DOMAIN="attendancesystem-b8cff.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="attendancesystem-b8cff"
VITE_FIREBASE_STORAGE_BUCKET="attendancesystem-b8cff.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="266090348630"
VITE_FIREBASE_APP_ID="1:266090348630:web:b43a2792604bcc9638fbf7"
```

### 4. Initialize Admin User

Run the setup script to create the initial admin account:

```bash
npx tsx setup-firebase.js
```

This creates the user `admin@school.edu` with password `admin12345` (you can change these in the script).

### 5. Run Locally

```bash
npm run dev
```

This starts both the Vite dev server and the Express API server on `http://localhost:3000`.

### 6. Run Backend Separately (Optional)

If you want to run just the backend API server:

```bash
cd backend
npm install
node server.js
```

The backend will be available on `http://localhost:3000`.

## Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── send-email.js       # Email sending (Gmail SMTP)
│   └── users.js            # User creation
├── backend/                # Standalone Express API server (for Render/self-host)
│   ├── server.js           # Gmail SMTP + Firebase Admin
│   └── package.json
├── src/                    # React frontend (Vite)
│   ├── pages/
│   ├── components/
│   ├── contexts/
│   ├── lib/
│   └── firebase.ts
├── server.ts               # Dev server (Vite middleware + API routes)
├── setup-firebase.js       # Admin user bootstrap script
├── firebase-service-account.json  # Firebase Admin SDK key (DO NOT SHARE)
├── .env                    # Environment variables (DO NOT SHARE)
└── package.json
```

## Email Notifications

When a student is marked **Absent** or **Late**, the system sends an email notification to the parent/guardian via **Gmail SMTP**. The email includes the student's name, status, and date.

To use a different Gmail account, update the `GMAIL_SMTP_USER` and `GMAIL_SMTP_PASS` in `.env`.

## Security Notes

- `firebase-service-account.json` and `.env` contain sensitive credentials. They are listed in `.gitignore` and should never be committed to version control.
- The Gmail App Password gives access to send emails from your Gmail account — keep it secure.
- The Firebase service account has admin access to your Firebase project — treat it like a root password.
