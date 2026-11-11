# KIET & KIET-W Student Feedback Application

A full-stack, enterprise-grade academic student feedback web application for **KIET** (Main Campus) and **KIET Women’s College (KIET-W)** built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **NeonDB (Serverless PostgreSQL)**.

---

## 🎨 Design System
- **Primary Navy Blue**: `#123B70`
- **Secondary Royal Blue**: `#2563EB`
- **Light Grey Background**: `#F4F7FB`
- **Card Background**: `#FFFFFF`
- **Dark Navy Text**: `#172B4D`
- Fully responsive for mobile phones, tablets, and desktop workstations.

---

## 🚀 Key Features

### 1. Public Student Feedback Flow (`/`)
- **No Login Required** for students.
- **Fields in Exact Required Order**:
  1. **Student Identity**: Full Name, Email (format validated), Phone (strict 10-digit validation), and Roll Number.
  2. **Campus Dropdown**: `KIET` (Main Campus) and `KIETW` (Women’s College).
  3. **Branch Dropdown**: Dynamically filtered by campus, strictly limited to `CYBER`, `AID`, `CSM`, `CAI`, and `CSD` (never IT, EEE, or ECE).
  4. **Feedback Type**: `FRM` (Faculty Review Metric) or `SRM` (Student Review Metric).
  5. **Faculty Selector**:
     - Stays **disabled** until Campus, Branch, and Feedback Type are all chosen.
     - Displays only active faculty matching that campus, branch, and feedback type.
     - Never mixes campuses or feedback types.
     - Changing campus, branch, or type immediately clears selection and reloads the matching list.
     - Allows selecting one or more faculty members (multi-select).
  6. **Three Mandatory Questions** (Multiline textareas):
     - *Q1: Which subject are you finding most difficult, and which topics are challenging?*
     - *Q2: What is the most important improvement you expect from your faculty?*
     - *Q3: Any additional comments or suggestions?*
  7. **Pre-Submission Review Screen**:
     - Formatted review of all student and academic details before finalizing.
     - Allows going back to edit if needed.
  8. **Strict Duplicate Prevention**:
     - Pre-checks and backend-enforces that a student with the same Roll Number cannot submit duplicate feedback for the same faculty member under the same feedback type.
  9. **Submission Confirmation**:
     - Exact success message displayed: *“Thank you! Your feedback has been submitted successfully.”*
     - In accordance with institutional policy, feedback cannot be edited or deleted by students once submitted.

### 2. Hidden Administrator Portal (`/admin`)
- **Completely Hidden**: No link anywhere on the public student pages.
- **Server-Side Security**: Protected by Neon Auth / session JWT cookies and checked on every admin route and API.
- **Admin Functions**:
  - **Real Statistics**: Live counts from Neon DB for Total Submissions, KIET submissions, KIET-W submissions, FRM submissions, and SRM submissions, plus branch breakdowns.
  - **Feedback Table**: Search by student name, roll number, and faculty name. Filters by Campus, Branch, Feedback Type, and Date Range with pagination. View full responses in a modal, and delete records with a confirmation dialog.
  - **Faculty Management**:
    - Separated by Campus tabs (`KIET` vs `KIETW`).
    - Add new faculty, edit details.
    - **Soft Deactivation & Reactivation**: Active flag is toggled so historical feedback is permanently preserved.
    - **CSV Bulk Import**: Upload or paste CSV to bulk import faculty with error reporting. Download sample CSV template.
  - **Data Export**: Export filtered feedback datasets to **CSV** and **Excel (.xlsx)**.
  - **Security Protections**: Rate limiting on the feedback submission API and input sanitization against XSS.

---

## 🛠️ Environment Variables Setup

Create a `.env.local` file in the project root:

```env
# Neon Serverless PostgreSQL Connection String
DATABASE_URL=postgresql://neondb_owner:npg_iYKWmOj2nea5@ep-cool-math-beeceqba-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require

# Secret key for Admin Session JWT signing
ADMIN_SECRET_KEY=kiet-feedback-super-secure-admin-secret-key-2026-neon-auth

# Default Initial Administrator Credentials
ADMIN_DEFAULT_EMAIL=admin@kiet.edu
ADMIN_DEFAULT_PASSWORD=Admin@KIET2026!
```

---

## 💻 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Migration & Sample Data Seeding
Initializes all PostgreSQL tables, foreign keys, indexes, and seeds 31 clearly labelled sample faculty members:
```bash
npm run db:seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the Student Portal.  
Access the Hidden Admin Portal at [http://localhost:3000/admin](http://localhost:3000/admin).

### 4. Build and Run Production Server
```bash
npm run build
npm run start
```

### 5. Run Automated End-to-End Test Suite
Runs 28 automated tests verifying the public student form, duplicate checks, validation, rate limiting, admin authentication, CSV/Excel exports, and soft deactivation:
```bash
npx tsx scripts/test-e2e.ts
```

---

## 🚢 Deployment Guide (Vercel)

1. Push your repository to GitHub or GitLab.
2. Go to [Vercel](https://vercel.com) and click **Import Project**.
3. In **Environment Variables**, add:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `ADMIN_SECRET_KEY`: A strong random string.
   - `ADMIN_DEFAULT_EMAIL`: `admin@kiet.edu`
   - `ADMIN_DEFAULT_PASSWORD`: `Admin@KIET2026!`
4. Click **Deploy**. Vercel will automatically build the Next.js app and connect to NeonDB.
