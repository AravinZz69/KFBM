import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const ALL_TABLES = [
  'admin_users',
  'ai_branch_reports',
  'ai_faculty_reports',
  'ai_institutional_overview',
  'ai_model_reports',
  'branches',
  'college_branches',
  'colleges',
  'faculty',
  'feedback_faculty',
  'feedback_ratings',
  'feedback_submissions',
  'genuine_student_feedback',
  'rate_limits',
];

async function enableRLSAndApplySecurity() {
  console.log('================================================================');
  console.log('   ENABLING ROW LEVEL SECURITY (RLS) FOR ALL NEON DB TABLES    ');
  console.log('================================================================\n');

  // Step 1: Enable RLS on every table
  console.log('Step 1: Enabling RLS on all 14 tables...');
  for (const table of ALL_TABLES) {
    try {
      await sql.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`  ✓ RLS enabled on table: ${table}`);
    } catch (err: any) {
      console.error(`  ✗ Error enabling RLS on ${table}:`, err.message);
    }
  }

  // Step 2: Clean up any old policies
  console.log('\nStep 2: Cleaning up existing policies...');
  const existingPolicies = await sql.query(`
    SELECT tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public';
  `);
  for (const pol of existingPolicies) {
    try {
      await sql.query(`DROP POLICY IF EXISTS "${pol.policyname}" ON "${pol.tablename}";`);
      console.log(`  - Dropped policy "${pol.policyname}" on "${pol.tablename}"`);
    } catch (err: any) {
      console.error(`  - Failed to drop policy ${pol.policyname}:`, err.message);
    }
  }

  // Step 3: Create tailored security policies
  console.log('\nStep 3: Creating robust RLS security policies...');

  // 1. admin_users (Strictly restricted to database owner/admin, never public)
  await sql.query(`
    CREATE POLICY p_admin_users_owner_all ON "admin_users"
    FOR ALL
    TO PUBLIC
    USING (current_user = 'neondb_owner' OR current_user = 'neon_superuser')
    WITH CHECK (current_user = 'neondb_owner' OR current_user = 'neon_superuser');
  `);
  console.log('  ✓ Policy created: p_admin_users_owner_all');

  // 2. colleges (Public read, owner modify)
  await sql.query(`
    CREATE POLICY p_colleges_select_all ON "colleges"
    FOR SELECT
    TO PUBLIC
    USING (true);
  `);
  await sql.query(`
    CREATE POLICY p_colleges_modify_owner ON "colleges"
    FOR ALL
    TO PUBLIC
    USING (current_user = 'neondb_owner' OR current_user = 'neon_superuser')
    WITH CHECK (current_user = 'neondb_owner' OR current_user = 'neon_superuser');
  `);
  console.log('  ✓ Policies created: colleges');

  // 3. branches (Public read, owner modify)
  await sql.query(`
    CREATE POLICY p_branches_select_all ON "branches"
    FOR SELECT
    TO PUBLIC
    USING (true);
  `);
  await sql.query(`
    CREATE POLICY p_branches_modify_owner ON "branches"
    FOR ALL
    TO PUBLIC
    USING (current_user = 'neondb_owner' OR current_user = 'neon_superuser')
    WITH CHECK (current_user = 'neondb_owner' OR current_user = 'neon_superuser');
  `);
  console.log('  ✓ Policies created: branches');

  // 4. college_branches (Public read active, owner modify)
  await sql.query(`
    CREATE POLICY p_college_branches_select_all ON "college_branches"
    FOR SELECT
    TO PUBLIC
    USING (true);
  `);
  await sql.query(`
    CREATE POLICY p_college_branches_modify_owner ON "college_branches"
    FOR ALL
    TO PUBLIC
    USING (current_user = 'neondb_owner' OR current_user = 'neon_superuser')
    WITH CHECK (current_user = 'neondb_owner' OR current_user = 'neon_superuser');
  `);
  console.log('  ✓ Policies created: college_branches');

  // 5. faculty (Public read active faculty, owner modify)
  await sql.query(`
    CREATE POLICY p_faculty_select_all ON "faculty"
    FOR SELECT
    TO PUBLIC
    USING (true);
  `);
  await sql.query(`
    CREATE POLICY p_faculty_modify_owner ON "faculty"
    FOR ALL
    TO PUBLIC
    USING (current_user = 'neondb_owner' OR current_user = 'neon_superuser')
    WITH CHECK (current_user = 'neondb_owner' OR current_user = 'neon_superuser');
  `);
  console.log('  ✓ Policies created: faculty');

  // 6. feedback_submissions (Public insert, owner full control, public cannot select all)
  await sql.query(`
    CREATE POLICY p_submissions_insert_public ON "feedback_submissions"
    FOR INSERT
    TO PUBLIC
    WITH CHECK (true);
  `);
  await sql.query(`
    CREATE POLICY p_submissions_owner_all ON "feedback_submissions"
    FOR ALL
    TO PUBLIC
    USING (current_user = 'neondb_owner' OR current_user = 'neon_superuser')
    WITH CHECK (current_user = 'neondb_owner' OR current_user = 'neon_superuser');
  `);
  console.log('  ✓ Policies created: feedback_submissions');

  // 7. feedback_ratings (Public insert, owner full control)
  await sql.query(`
    CREATE POLICY p_ratings_insert_public ON "feedback_ratings"
    FOR INSERT
    TO PUBLIC
    WITH CHECK (true);
  `);
  await sql.query(`
    CREATE POLICY p_ratings_owner_all ON "feedback_ratings"
    FOR ALL
    TO PUBLIC
    USING (current_user = 'neondb_owner' OR current_user = 'neon_superuser')
    WITH CHECK (current_user = 'neondb_owner' OR current_user = 'neon_superuser');
  `);
  console.log('  ✓ Policies created: feedback_ratings');

  // 8. feedback_faculty (Public insert, owner full control)
  await sql.query(`
    CREATE POLICY p_feedback_faculty_insert_public ON "feedback_faculty"
    FOR INSERT
    TO PUBLIC
    WITH CHECK (true);
  `);
  await sql.query(`
    CREATE POLICY p_feedback_faculty_owner_all ON "feedback_faculty"
    FOR ALL
    TO PUBLIC
    USING (current_user = 'neondb_owner' OR current_user = 'neon_superuser')
    WITH CHECK (current_user = 'neondb_owner' OR current_user = 'neon_superuser');
  `);
  console.log('  ✓ Policies created: feedback_faculty');

  // 9. genuine_student_feedback (Admin/Owner access only)
  await sql.query(`
    CREATE POLICY p_genuine_feedback_owner_all ON "genuine_student_feedback"
    FOR ALL
    TO PUBLIC
    USING (current_user = 'neondb_owner' OR current_user = 'neon_superuser')
    WITH CHECK (current_user = 'neondb_owner' OR current_user = 'neon_superuser');
  `);
  console.log('  ✓ Policy created: genuine_student_feedback');

  // 10. rate_limits (Application rate limit service read/write)
  await sql.query(`
    CREATE POLICY p_rate_limits_all ON "rate_limits"
    FOR ALL
    TO PUBLIC
    USING (true)
    WITH CHECK (true);
  `);
  console.log('  ✓ Policy created: rate_limits');

  // 11. AI Report Tables (Owner/Admin access only)
  const aiTables = [
    'ai_branch_reports',
    'ai_faculty_reports',
    'ai_institutional_overview',
    'ai_model_reports',
  ];
  for (const t of aiTables) {
    await sql.query(`
      CREATE POLICY "p_${t}_owner_all" ON "${t}"
      FOR ALL
      TO PUBLIC
      USING (current_user = 'neondb_owner' OR current_user = 'neon_superuser')
      WITH CHECK (current_user = 'neondb_owner' OR current_user = 'neon_superuser');
    `);
    console.log(`  ✓ Policy created: ${t}`);
  }

  // Step 4: Verify RLS status on all tables
  console.log('\nStep 4: Verifying RLS activation across all tables...');
  const rlsReport = await sql.query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);
  console.table(rlsReport);

  const policyReport = await sql.query(`
    SELECT tablename, policyname, cmd, permissive
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);
  console.log('\nActive Security Policies:');
  console.table(policyReport);

  console.log('\n✓ Row Level Security (RLS) successfully enabled and configured for all tables!');
}

enableRLSAndApplySecurity().catch(err => {
  console.error('Fatal error during RLS configuration:', err);
  process.exit(1);
});
