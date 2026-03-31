
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 Starting Organization Migration...');

  // 1. Get all unique departments from users
  const { data: users, error: uErr } = await supabase.from('users').select('id, department').is('deleted_at', null);
  if (uErr) throw uErr;

  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean)));
  console.log('Found unique departments:', departments);

  // 2. Create teams for each department if they don't exist
  for (const dept of departments) {
    const { data: existingTeam } = await supabase.from('teams').select('id').eq('name', dept).single();
    
    let teamId;
    if (!existingTeam) {
      console.log(`Creating team: ${dept}`);
      const { data: newTeam, error: cErr } = await supabase.from('teams').insert([{ name: dept, description: `${dept} 조직입니다.` }]).select().single();
      if (cErr) console.error(`Failed to create team ${dept}:`, cErr);
      teamId = newTeam?.id;
    } else {
      teamId = existingTeam.id;
    }

    // 3. Update users who belong to this department
    if (teamId) {
      const { error: updErr } = await supabase.from('users').update({ team_id: teamId }).eq('department', dept);
      if (updErr) console.error(`Failed to link users to ${dept}:`, updErr);
      else console.log(`Linked users to team: ${dept}`);
    }
  }

  console.log('✅ Migration Complete!');
}

migrate();
