import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Inspecting faculty designations in DB...');
  const distinct = await sql`
    SELECT designation, COUNT(*) as count 
    FROM faculty 
    GROUP BY designation
  `;
  console.log('Current designations:', distinct);

  // Check if any faculty names contain 'assistant professor'
  const nameCheck = await sql`
    SELECT id, name, designation 
    FROM faculty 
    WHERE name ILIKE '%assistant%' OR name ILIKE '%professor%'
    LIMIT 10
  `;
  console.log('Faculty names with assistant/professor:', nameCheck);

  // If column allows NULL or empty string, let's see column definition
  // Let's drop NOT NULL constraint on designation if present so it can be empty/null, or set to empty string
  try {
    await sql`ALTER TABLE faculty ALTER COLUMN designation DROP NOT NULL`;
    console.log('✓ Dropped NOT NULL on faculty.designation');
  } catch (e: any) {
    console.log('Note on ALTER TABLE:', e.message);
  }

  // Clear designation if it is 'Assistant Professor'
  const updated = await sql`
    UPDATE faculty 
    SET designation = '' 
    WHERE designation ILIKE '%assistant professor%'
  `;
  console.log('✓ Updated faculty rows where designation ILIKE %assistant professor%');

  // Check designations again
  const after = await sql`
    SELECT designation, COUNT(*) as count 
    FROM faculty 
    GROUP BY designation
  `;
  console.log('Designations after update:', after);
}

main().catch(console.error);
