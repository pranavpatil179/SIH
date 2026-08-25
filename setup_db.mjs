import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres.ngbavxuirjhzaatdniyp:SIHSupabase2026!@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to db');
  
  const schema = fs.readFileSync('supabase/schema.sql', 'utf-8');
  console.log('Applying schema...');
  await client.query(schema);
  
  const seed = fs.readFileSync('supabase/seed.sql', 'utf-8');
  console.log('Applying seed...');
  await client.query(seed);
  
  console.log('Done!');
  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
