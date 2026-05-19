import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_SMTP_USER,
    pass: process.env.GMAIL_SMTP_PASS,
  },
});

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { studentName, parentEmail, status, date } = JSON.parse(event.body || '{}');

  if (!studentName || !parentEmail || !status || !date) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  if (!process.env.GMAIL_SMTP_USER || !process.env.GMAIL_SMTP_PASS) {
    console.log(`[Mock Email] To: ${parentEmail} | Subject: Attendance | Body: ${studentName} was ${status} on ${date}.`);
    return { statusCode: 200, body: JSON.stringify({ success: true, mocked: true }) };
  }

  try {
    await transporter.sendMail({
      from: `"School Attendance" <${process.env.GMAIL_SMTP_USER}>`,
      to: parentEmail,
      subject: `Attendance Notification: ${studentName} is ${status}`,
      text: `Dear Parent/Guardian,\n\nThis is to inform you that your child, ${studentName}, was marked ${status.toUpperCase()} on ${date}.\n\nPlease contact the school if you have concerns.\n\nThank you.`,
    });
    console.log(`Email sent to ${parentEmail} for ${studentName} (${status})`);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err: any) {
    console.error('Failed to send email:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email', details: err.message }) };
  }
};
