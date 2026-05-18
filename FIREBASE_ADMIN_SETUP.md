# Firebase Admin Setup Guide

This document explains how the initial admin user (`admin@school.edu`) was automatically created in your Firebase Authentication and Firestore database.

## How it works: `setup-firebase.js`

We used a "seed" or "bootstrap" script called `setup-firebase.js` to initialize your database. Here is exactly what is happening in that script:

### 1. The Service Account Key (`firebase-service-account.json`)
Normally, web apps use an API Key (like `VITE_FIREBASE_API_KEY`) to log in as users. However, developers and servers need absolute, unrestricted backend access to bypass security rules for administrative tasks.
That's what the `firebase-service-account.json` file is—it is a secure private key downloaded from your Firebase Console (Project Settings > Service Accounts) that grants "backend admin" access to your project.

### 2. The Firebase Admin SDK
In the script, we import the `firebase-admin` package instead of the standard `firebase` client package:
```javascript
import { initializeApp, cert } from 'firebase-admin/app';
```
This SDK reads your Service Account JSON file and authenticates on the backend.

### 3. Automatically Creating the User (Auth + Firestore)
Using those admin privileges, the script performs two critical actions automatically without needing you to click through the web UI:

1. **Firebase Authentication Injection**: It checks if `admin@school.edu` exists. If not, it uses `auth.createUser()` to forcefully register the user with a predefined password (`admin12345`). This bypasses the normal signup flow.
2. **Firestore Synchronization**: It takes the unique ID (`uid`) generated in step 1, and creates a companion document inside the `users` Firestore collection: 
   ```javascript
   db.collection('users').doc(userRecord.uid).set({ 
       email: 'admin@school.edu',
       fullname: 'System Administrator',
       role: 'admin' 
   });
   ```

***Important Note:** The `role: 'admin'` field is critical. Your `firestore.rules` is specifically programmed to check the `users` collection for this `role` field. That is how the system knows who gets top-level admin rights!*

---

## How to run or modify it manually

If you ever clear your Firebase database or need to recreate the initial admin, you can run this script directly from the terminal. 

### 1. Modify the Script (Optional)
Before running it, you can open `setup-firebase.js` and change the email and password variables on lines 18 and 19 to whatever you want your new admin to be.

### 2. Execute it via Terminal
To run the script in your project environment, open your terminal/shell and run:

```bash
npx tsx setup-firebase.js
```
*(We use `npx tsx` instead of `node` to smoothly execute modern ES module `import` syntax.)*

### 3. Check the Firebase Console
After running it, you will see output like:
> `Created Admin user in Firebase Auth...`

You can then log into your [Firebase Console](https://console.firebase.google.com/), click on **Authentication** to see the new user, and click on **Firestore Database** > `users` collection to see the corresponding database record.
