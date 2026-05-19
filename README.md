# Attendance and Notification System

A school attendance management system with email notifications for absent/late students, built with Supabase and Netlify.

## Local Setup

### Prerequisites

- Node.js >= 20

### 1. Install Dependencies

```bash
npm install
```

> **Windows users:** If `npm install` is blocked by execution policy errors, run this in PowerShell first:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

### 2. Supabase Setup

1. Go to [Supabase](https://supabase.com/) and create a project.
2. Go to the **SQL Editor** and run the contents of `supabase-schema.sql` to create the tables and RLS policies.
3. Go to **Project Settings** > **API** and copy your project URL and keys.
4. Go to **Authentication** > **Users** and create the initial admin user manually:
   - Email: `admin@school.edu`
   - Password: `admin12345`
   - Then insert a record into the `users` table with the user's `auth_id`, email, fullname, and `role: 'admin'`.

### 3. Create `.env`

Create a file named `.env` in the project root with the following contents:

```bash
# Gemini AI API key (for any AI features)
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# App URL for local development
APP_URL="http://localhost:3000"

# Gmail SMTP credentials (for sending attendance notifications)
GMAIL_SMTP_USER="miketanny893@gmail.com"
GMAIL_SMTP_PASS="acjy mvoh fbac zibf"

# Supabase Configuration
VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
```

> **Warning:** This file contains live credentials. It is already in `.gitignore` and should never be committed to a public repository.

### 4. Run Locally

```bash
npm run dev
```

This starts Netlify Dev, which serves the Vite frontend and Netlify Functions on `http://localhost:8888`.

### 5. Deploy to Netlify

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).
2. Go to [Netlify](https://app.netlify.com/) and create a new site from your repo.
3. Set the following environment variables in Netlify:
   - `GMAIL_SMTP_USER`
   - `GMAIL_SMTP_PASS`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. Netlify Functions will be automatically deployed alongside the frontend.

## Project Structure

```
├── netlify/
│   └── functions/
│       ├── send-email.ts       # Gmail SMTP email sending
│       └── users.ts            # User creation via Supabase Admin API
├── src/
│   ├── pages/                  # React page components
│   ├── components/             # Reusable UI components
│   ├── contexts/               # Auth context (Supabase)
│   ├── lib/                    # API config
│   ├── firebase.ts             # Supabase client (named for compatibility)
│   └── main.tsx
├── supabase-schema.sql         # Database schema + RLS policies
├── netlify.toml                # Netlify configuration
├── .env                        # Environment variables (DO NOT SHARE)
└── package.json
```

## Email Notifications

When a student is marked **Absent** or **Late**, the system sends an email notification to the parent/guardian via **Gmail SMTP**. The email includes the student's name, status, and date.

To use a different Gmail account, update the `GMAIL_SMTP_USER` and `GMAIL_SMTP_PASS` in `.env`.

## Security Notes

- `.env` contains sensitive credentials. It is listed in `.gitignore` and should never be committed to version control.
- The Gmail App Password gives access to send emails from your Gmail account — keep it secure.
- The Supabase service role key has full admin access to your database — treat it like a root password.
