import admin from 'firebase-admin';

// Initialize Firebase Admin cleanly if it hasn't been instantiated yet
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replaces stringified newlines back to functional secret format keys
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      }),
    });
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
  }
}

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

  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin not configured dynamically' });
  }

  const { fullname, email, password, role } = req.body;
  
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullname,
    });

    await admin.firestore().collection('users').doc(userRecord.uid).set({
      fullname,
      email,
      role,
      created_at: Date.now()
    });

    return res.status(201).json({ success: true, uid: userRecord.uid });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
