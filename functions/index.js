import { onRequest } from "firebase-functions/v2/https";
import nodemailer from "nodemailer";
import corsLib from "cors";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
const adminApp = initializeApp();
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

const cors = corsLib({ origin: true });

export const sendEmail = onRequest({ region: "us-central1" }, async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { studentName, parentEmail, status, date } = req.body;

    if (!studentName || !parentEmail || !status || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const smtpUser = process.env.GMAIL_SMTP_USER;
    const smtpPass = process.env.GMAIL_SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      return res.status(500).json({ error: "SMTP configuration missing" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"School Attendance" <${smtpUser}>`,
      to: parentEmail,
      subject: `Attendance Notification: ${studentName} is ${status}`,
      text: `Dear Parent/Guardian,\n\nThis is to inform you that your child, ${studentName}, was marked ${status.toUpperCase()} on ${date}.\n\nPlease contact the school if you have concerns.\n\nThank you.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return res.json({ success: true });
    } catch (err) {
      console.error("Failed to send email:", err);
      return res.status(500).json({ error: "Failed to send email", details: err.message });
    }
  });
});

export const manageUsers = onRequest({ region: "us-central1" }, async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { fullname, email, password, role } = req.body;
    
    try {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: fullname,
      });

      await adminDb.collection("users").doc(userRecord.uid).set({
        fullname,
        email,
        role
      });

      return res.status(201).json({ success: true, uid: userRecord.uid });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(400).json({ error: error.message });
    }
  });
});
