import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // ✅ Handle CORS Preflight perfectly
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "https://notificationsystem.web.app");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { studentName, parentEmail, status, date } = req.body;
  if (!studentName || !parentEmail || !status || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Fallback to mock email if credentials are missing in the environment
  if (!process.env.GMAIL_SMTP_USER || !process.env.GMAIL_SMTP_PASS) {
    console.warn(`[Mock Email] To: ${parentEmail} | Subject: Attendance | Body: ${studentName} was ${status} on ${date}.`);
    return res.status(200).json({ success: true, mocked: true });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_SMTP_USER,
      pass: process.env.GMAIL_SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"School Attendance" <${process.env.GMAIL_SMTP_USER}>`,
    to: parentEmail,
    subject: `Attendance Notification: ${studentName} is ${status}`,
    text: `Dear Parent/Guardian,\n\nThis is to inform you that your child, ${studentName}, was marked ${status.toUpperCase()} on ${date}.\n\nPlease contact the school if you have concerns.\n\nThank you.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to send email:', err);
    return res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
}
