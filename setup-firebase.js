// file: setup-firebase.js
// Run this with: node setup-firebase.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// Replace with the path to the JSON file you downloaded
const serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function setup() {
  const adminEmail = 'admin@school.edu';
  const adminPassword = 'admin12345';
  
  try {
    // 1. Create the user in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminEmail);
      console.log('User already exists in Firebase Auth.');
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: 'System Administrator',
        });
        console.log('Created Admin user in Firebase Auth:', userRecord.uid);
      } else { throw e; }
    }

    // 2. Create the user document in Firestore to assign the "admin" role
    await db.collection('users').doc(userRecord.uid).set({
      fullname: 'System Administrator',
      email: adminEmail,
      role: 'admin' // CRITICAL: This is what links to the isAdmin() security rule
    });
    
    console.log('Successfully wrote admin user to Firestore "users" collection.');
    console.log('You can now log in with -> Email:', adminEmail, '| Password:', adminPassword);
    
  } catch (error) {
    console.error('Error setting up Firebase:', error);
  }
}

setup();