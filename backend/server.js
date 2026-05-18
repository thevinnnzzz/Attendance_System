import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Firebase Admin SDK – initialise from file (local) or env var (Render)
// ---------------------------------------------------------------------------
let adminAuth = null;
let adminDb = null;

function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch {
      console.warn('FIREBASE_SERVICE_ACCOUNT env var is not valid JSON.');
    }
  }

  if (!serviceAccount) {
    try {
      const raw = readFileSync(resolve('firebase-service-account.json'), 'utf8');
      serviceAccount = JSON.parse(raw);
    } catch {
      console.warn('firebase-service-account.json not found locally.');
    }
  }

  if (!serviceAccount) {
    console.warn('Firebase Admin not configured – /api/users endpoint will fail.');
    return;
  }

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  try {
    const adminApp = initializeApp({ credential: cert(serviceAccount) });
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    console.log('Firebase Admin SDK initialised.');
  } catch (err) {
    console.error('Firebase Admin init failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Gmail SMTP email setup
// ---------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_SMTP_USER,
    pass: process.env.GMAIL_SMTP_PASS,
  },
});

async function sendEmailViaGmail({ to, subject, text }) {
  if (!process.env.GMAIL_SMTP_USER || !process.env.GMAIL_SMTP_PASS) {
    console.log(`[Mock Email] To: ${to} | ${subject}`);
    return { success: true, mocked: true };
  }
  await transporter.sendMail({
    from: `"School Attendance" <${process.env.GMAIL_SMTP_USER}>`,
    to,
    subject,
    text,
  });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check (useful for Render monitoring)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// POST /api/send-email – send attendance notification
app.post('/api/send-email', async (req, res) => {
  const { studentName, parentEmail, status, date } = req.body;

  if (!studentName || !parentEmail || !status || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await sendEmailViaGmail({
      to: parentEmail,
      subject: `Attendance Notification: ${studentName} is ${status}`,
      text: `Dear Parent/Guardian,\n\nThis is to inform you that your child, ${studentName}, was marked ${status.toUpperCase()} on ${date}.\n\nPlease contact the school if you have concerns.\n\nThank you.`,
    });
    console.log(`Email sent to ${parentEmail} for ${studentName} (${status})`);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to send email:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// POST /api/users – create teacher / admin user
app.post('/api/users', async (req, res) => {
  if (!adminAuth || !adminDb) {
    return res
      .status(500)
      .json({ error: 'Firebase Admin not configured on the server.' });
  }

  const { fullname, email, password, role } = req.body;

  try {
    const userRecord = await adminAuth.createUser({ email, password, displayName: fullname });

    await adminDb.collection('users').doc(userRecord.uid).set({
      fullname,
      email,
      role,
      created_at: Date.now(),
    });

    res.status(201).json({ success: true, uid: userRecord.uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
initFirebaseAdmin();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API running on port ${PORT}`);
});
