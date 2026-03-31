
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('--- Checking Teams ---');
  const { data: teams, error: e1 } = await supabase.from('teams').select('*');
  if (e1) console.error(e1);
  else console.log('Teams Count:', teams?.length, teams);

  console.log('\n--- Checking Users (Team Linkage) ---');
  const { data: users, error: e2 } = await supabase.from('users').select('id, name, department, team_id').limit(10);
  if (e2) console.error(e2);
  else console.log('Users (limited 10):', users);
}

checkData();
