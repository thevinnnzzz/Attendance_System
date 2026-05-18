import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import dotenv from "dotenv";
dotenv.config();
console.log("SMTP USER:", process.env.GMAIL_SMTP_USER);
console.log("SMTP PASS EXISTS:", !!process.env.GMAIL_SMTP_PASS);

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 3000;

// Initialize Firebase Admin (Required to create users on behalf of the admin)
let adminAuth: any = null;
let adminDb: any = null;
try {
  const serviceAccount = JSON.parse(readFileSync(path.resolve(process.cwd(), 'firebase-service-account.json'), 'utf8'));
  const firebaseAdminApp = initializeApp({
    credential: cert(serviceAccount)
  });
  adminAuth = getAuth(firebaseAdminApp);
  adminDb = getFirestore(firebaseAdminApp);
} catch (error) {
  console.warn("Could not initialize Firebase Admin SDK. Creating users via API will fail.");
}

// Mailer Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_SMTP_USER,
    pass: process.env.GMAIL_SMTP_PASS,
  },
});

app.post('/api/send-email', async (req, res) => {
  const { studentName, parentEmail, status, date } = req.body;
  if (!studentName || !parentEmail || !status || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!process.env.GMAIL_SMTP_USER || !process.env.GMAIL_SMTP_PASS) {
    console.warn(`[Mock Email] To: ${parentEmail} | Subject: Attendance | Body: ${studentName} was ${status} on ${date}.`);
    return res.json({ success: true, mocked: true });
  }

  const mailOptions = {
    from: `"School Attendance" <${process.env.GMAIL_SMTP_USER}>`,
    to: parentEmail,
    subject: `Attendance Notification: ${studentName} is ${status}`,
    text: `Dear Parent/Guardian,\n\nThis is to inform you that your child, ${studentName}, was marked ${status.toUpperCase()} on ${date}.\n\nPlease contact the school if you have concerns.\n\nThank you.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${parentEmail} for ${studentName} (${status})`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to send email:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Admin endpoint to create new teachers/admins
app.post('/api/users', async (req, res) => {
  if (!adminAuth) {
    return res.status(500).json({ error: 'Firebase Admin not configured' });
  }

  const { fullname, email, password, role } = req.body;
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullname,
    });

    await adminDb.collection('users').doc(userRecord.uid).set({
      fullname,
      email,
      role
    });

    res.status(201).json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
