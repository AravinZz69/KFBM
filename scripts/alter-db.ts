import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is missing.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function alterTable() {
  console.log('Altering feedback_submissions table...');
  await sql.query(`ALTER TABLE feedback_submissions ALTER COLUMN email DROP NOT NULL;`);
  await sql.query(`ALTER TABLE feedback_submissions ALTER COLUMN phone DROP NOT NULL;`);
  await sql.query(`ALTER TABLE feedback_submissions ALTER COLUMN student_name DROP NOT NULL;`);
  await sql.query(`ALTER TABLE feedback_submissions ALTER COLUMN email SET DEFAULT '';`);
  await sql.query(`ALTER TABLE feedback_submissions ALTER COLUMN phone SET DEFAULT '';`);
  await sql.query(`ALTER TABLE feedback_submissions ALTER COLUMN student_name SET DEFAULT 'Anonymous Student';`);
  console.log('✓ Successfully made student_name optional and removed email/phone mandatory constraints.');
}

alterTable().catch(console.error);
