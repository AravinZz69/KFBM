import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not defined.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runMigrationAndSeed() {
  console.log('--- Starting Neon Database Schema Migration & Seeding ---');

  try {
    // 1. Create Colleges table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS colleges (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ colleges table verified');

    // 2. Create Branches table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ branches table verified');

    // 3. Create College-Branch mappings table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS college_branches (
        id SERIAL PRIMARY KEY,
        college_id INT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(college_id, branch_id)
      );
    `);
    console.log('✓ college_branches table verified');

    // 4. Create Faculty table with soft deactivation
    await sql.query(`
      CREATE TABLE IF NOT EXISTS faculty (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        college_id INT NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        feedback_type VARCHAR(10) NOT NULL CHECK (feedback_type IN ('FRM', 'SRM')),
        designation VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        active_flag BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ faculty table verified');

    // Indexes on faculty
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_faculty_college_branch_type ON faculty(college_id, branch_id, feedback_type, active_flag);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_faculty_email ON faculty(email);`);

    // 5. Create Feedback Submissions table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS feedback_submissions (
        id SERIAL PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        roll_number VARCHAR(50) NOT NULL,
        college_id INT NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
        branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        feedback_type VARCHAR(10) NOT NULL CHECK (feedback_type IN ('FRM', 'SRM')),
        q1_subject_challenges TEXT NOT NULL,
        q2_improvements TEXT NOT NULL,
        q3_additional_comments TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ feedback_submissions table verified');

    // Indexes on feedback_submissions
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_submissions_roll_number ON feedback_submissions(roll_number);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_submissions_college ON feedback_submissions(college_id);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_submissions_branch ON feedback_submissions(branch_id);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_submissions_type ON feedback_submissions(feedback_type);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON feedback_submissions(created_at DESC);`);

    // 6. Create Feedback Faculty junction table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS feedback_faculty (
        id SERIAL PRIMARY KEY,
        submission_id INT NOT NULL REFERENCES feedback_submissions(id) ON DELETE CASCADE,
        faculty_id INT NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(submission_id, faculty_id)
      );
    `);
    console.log('✓ feedback_faculty table verified');

    await sql.query(`CREATE INDEX IF NOT EXISTS idx_feedback_faculty_sub ON feedback_faculty(submission_id);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_feedback_faculty_fac ON feedback_faculty(faculty_id);`);

    // 7. Create Admin Users table for Neon Auth / server authentication
    await sql.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name VARCHAR(255) NOT NULL DEFAULT 'Administrator',
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ admin_users table verified');

    // 8. Create Rate Limit Tracking table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id SERIAL PRIMARY KEY,
        identifier VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await sql.query(`
      CREATE INDEX IF NOT EXISTS idx_rate_limits_ident ON rate_limits(identifier, action, created_at DESC);
    `);
    console.log('✓ rate_limits table verified');

    // ----------------- SEEDING DATA -----------------
    console.log('\n--- Seeding Initial Colleges & Branches ---');

    // Seed Colleges
    const collegesData = [
      { code: 'KIET', name: 'Kakinada Institute of Engineering & Technology (KIET)' },
      { code: 'KIETW', name: "KIET Women's College (KIET-W)" },
    ];

    for (const c of collegesData) {
      await sql.query(
        `INSERT INTO colleges (code, name) VALUES ($1, $2)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
        [c.code, c.name]
      );
    }
    console.log('✓ Colleges seeded (KIET, KIETW)');

    // Seed Branches: CYBER, AID, CSM, CAI, CSD (strictly limited, no IT/EEE/ECE)
    const branchesData = [
      { code: 'CYBER', name: 'Cyber Security (CYBER)' },
      { code: 'AID', name: 'Artificial Intelligence & Data Science (AID)' },
      { code: 'CSM', name: 'AI & Machine Learning (CSM)' },
      { code: 'CAI', name: 'Computer Science & Artificial Intelligence (CAI)' },
      { code: 'CSD', name: 'Computer Science & Design (CSD)' },
    ];

    for (const b of branchesData) {
      await sql.query(
        `INSERT INTO branches (code, name) VALUES ($1, $2)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
        [b.code, b.name]
      );
    }
    console.log('✓ Branches seeded (CYBER, AID, CSM, CAI, CSD)');

    // Link colleges to branches
    const collegesRes = await sql.query(`SELECT id, code FROM colleges`);
    const branchesRes = await sql.query(`SELECT id, code FROM branches`);

    const collegeMap = Object.fromEntries(collegesRes.map(c => [c.code, c.id]));
    const branchMap = Object.fromEntries(branchesRes.map(b => [b.code, b.id]));

    for (const cCode of ['KIET', 'KIETW']) {
      for (const bCode of ['CYBER', 'AID', 'CSM', 'CAI', 'CSD']) {
        await sql.query(
          `INSERT INTO college_branches (college_id, branch_id, active)
           VALUES ($1, $2, TRUE)
           ON CONFLICT (college_id, branch_id) DO NOTHING`,
          [collegeMap[cCode], branchMap[bCode]]
        );
      }
    }
    console.log('✓ College-branch mappings established for KIET and KIETW');

    // Seed Admin User
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@kiet.edu';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@KIET2026!';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await sql.query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1, $2, 'Campus Superadmin', 'superadmin')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [adminEmail, passwordHash]
    );
    console.log(`✓ Admin user verified (${adminEmail})`);

    // Seed Sample Faculty (clearly labelled sample data, no real faculty names)
    // We will seed faculty for each campus, each branch, and both FRM and SRM
    const existingFaculty = await sql.query(`SELECT COUNT(*) as count FROM faculty`);
    if (Number(existingFaculty[0]?.count || 0) === 0) {
      console.log('Seeding sample faculty data...');
      const sampleFacultyList = [
        // --- KIET CAMPUS ---
        // CYBER
        { name: 'Dr. Sample Alpha (CYBER-FRM)', college: 'KIET', branch: 'CYBER', type: 'FRM', desig: 'Professor & HOD', email: 'sample.alpha@kiet.edu' },
        { name: 'Prof. Sample Beta (CYBER-FRM)', college: 'KIET', branch: 'CYBER', type: 'FRM', desig: 'Associate Professor', email: 'sample.beta@kiet.edu' },
        { name: 'Dr. Sample Gamma (CYBER-SRM)', college: 'KIET', branch: 'CYBER', type: 'SRM', desig: 'Senior Professor', email: 'sample.gamma@kiet.edu' },
        { name: 'Prof. Sample Delta (CYBER-SRM)', college: 'KIET', branch: 'CYBER', type: 'SRM', desig: 'Assistant Professor', email: 'sample.delta@kiet.edu' },

        // AID
        { name: 'Dr. Sample Epsilon (AID-FRM)', college: 'KIET', branch: 'AID', type: 'FRM', desig: 'Professor', email: 'sample.epsilon@kiet.edu' },
        { name: 'Prof. Sample Zeta (AID-FRM)', college: 'KIET', branch: 'AID', type: 'FRM', desig: 'Assistant Professor', email: 'sample.zeta@kiet.edu' },
        { name: 'Dr. Sample Eta (AID-SRM)', college: 'KIET', branch: 'AID', type: 'SRM', desig: 'Associate Professor', email: 'sample.eta@kiet.edu' },
        { name: 'Prof. Sample Theta (AID-SRM)', college: 'KIET', branch: 'AID', type: 'SRM', desig: 'Assistant Professor', email: 'sample.theta@kiet.edu' },

        // CSM
        { name: 'Dr. Sample Iota (CSM-FRM)', college: 'KIET', branch: 'CSM', type: 'FRM', desig: 'Professor', email: 'sample.iota@kiet.edu' },
        { name: 'Prof. Sample Kappa (CSM-FRM)', college: 'KIET', branch: 'CSM', type: 'FRM', desig: 'Associate Professor', email: 'sample.kappa@kiet.edu' },
        { name: 'Dr. Sample Lambda (CSM-SRM)', college: 'KIET', branch: 'CSM', type: 'SRM', desig: 'Professor & Dean', email: 'sample.lambda@kiet.edu' },
        { name: 'Prof. Sample Mu (CSM-SRM)', college: 'KIET', branch: 'CSM', type: 'SRM', desig: 'Assistant Professor', email: 'sample.mu@kiet.edu' },

        // CAI
        { name: 'Dr. Sample Nu (CAI-FRM)', college: 'KIET', branch: 'CAI', type: 'FRM', desig: 'Professor', email: 'sample.nu@kiet.edu' },
        { name: 'Prof. Sample Xi (CAI-FRM)', college: 'KIET', branch: 'CAI', type: 'FRM', desig: 'Assistant Professor', email: 'sample.xi@kiet.edu' },
        { name: 'Dr. Sample Omicron (CAI-SRM)', college: 'KIET', branch: 'CAI', type: 'SRM', desig: 'Associate Professor', email: 'sample.omicron@kiet.edu' },
        { name: 'Prof. Sample Pi (CAI-SRM)', college: 'KIET', branch: 'CAI', type: 'SRM', desig: 'Assistant Professor', email: 'sample.pi@kiet.edu' },

        // CSD
        { name: 'Dr. Sample Rho (CSD-FRM)', college: 'KIET', branch: 'CSD', type: 'FRM', desig: 'Professor', email: 'sample.rho@kiet.edu' },
        { name: 'Prof. Sample Sigma (CSD-FRM)', college: 'KIET', branch: 'CSD', type: 'FRM', desig: 'Associate Professor', email: 'sample.sigma@kiet.edu' },
        { name: 'Dr. Sample Tau (CSD-SRM)', college: 'KIET', branch: 'CSD', type: 'SRM', desig: 'Professor', email: 'sample.tau@kiet.edu' },
        { name: 'Prof. Sample Upsilon (CSD-SRM)', college: 'KIET', branch: 'CSD', type: 'SRM', desig: 'Assistant Professor', email: 'sample.upsilon@kiet.edu' },

        // --- KIETW CAMPUS (Women's College) ---
        // CYBER
        { name: 'Dr. Sample W-Alpha (CYBER-FRM)', college: 'KIETW', branch: 'CYBER', type: 'FRM', desig: 'Professor & HOD', email: 'sample.walpha@kiet.edu' },
        { name: 'Prof. Sample W-Beta (CYBER-FRM)', college: 'KIETW', branch: 'CYBER', type: 'FRM', desig: 'Assistant Professor', email: 'sample.wbeta@kiet.edu' },
        { name: 'Dr. Sample W-Gamma (CYBER-SRM)', college: 'KIETW', branch: 'CYBER', type: 'SRM', desig: 'Associate Professor', email: 'sample.wgamma@kiet.edu' },

        // AID
        { name: 'Dr. Sample W-Delta (AID-FRM)', college: 'KIETW', branch: 'AID', type: 'FRM', desig: 'Professor', email: 'sample.wdelta@kiet.edu' },
        { name: 'Prof. Sample W-Epsilon (AID-SRM)', college: 'KIETW', branch: 'AID', type: 'SRM', desig: 'Assistant Professor', email: 'sample.wepsilon@kiet.edu' },

        // CSM
        { name: 'Dr. Sample W-Zeta (CSM-FRM)', college: 'KIETW', branch: 'CSM', type: 'FRM', desig: 'Associate Professor', email: 'sample.wzeta@kiet.edu' },
        { name: 'Prof. Sample W-Eta (CSM-SRM)', college: 'KIETW', branch: 'CSM', type: 'SRM', desig: 'Professor', email: 'sample.weta@kiet.edu' },

        // CAI
        { name: 'Dr. Sample W-Theta (CAI-FRM)', college: 'KIETW', branch: 'CAI', type: 'FRM', desig: 'Professor', email: 'sample.wtheta@kiet.edu' },
        { name: 'Prof. Sample W-Iota (CAI-SRM)', college: 'KIETW', branch: 'CAI', type: 'SRM', desig: 'Assistant Professor', email: 'sample.wiota@kiet.edu' },

        // CSD
        { name: 'Dr. Sample W-Kappa (CSD-FRM)', college: 'KIETW', branch: 'CSD', type: 'FRM', desig: 'Associate Professor', email: 'sample.wkappa@kiet.edu' },
        { name: 'Prof. Sample W-Lambda (CSD-SRM)', college: 'KIETW', branch: 'CSD', type: 'SRM', desig: 'Professor', email: 'sample.wlambda@kiet.edu' },
      ];

      for (const f of sampleFacultyList) {
        await sql.query(
          `INSERT INTO faculty (name, college_id, branch_id, feedback_type, designation, email, active_flag)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
          [f.name, collegeMap[f.college], branchMap[f.branch], f.type, f.desig, f.email]
        );
      }
      console.log(`✓ Seeded ${sampleFacultyList.length} clearly labelled sample faculty members.`);
    } else {
      console.log(`Faculty table already contains ${existingFaculty[0].count} records.`);
    }

    console.log('\n--- Neon Database Setup & Seed Completed Successfully! ---');
  } catch (error) {
    console.error('Database migration/seed error:', error);
    process.exit(1);
  }
}

runMigrationAndSeed();
