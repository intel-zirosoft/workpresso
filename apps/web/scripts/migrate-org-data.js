
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 Starting Organization Migration...');

  // 1. Get users with department but no team_id
  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('id, department, team_id')
    .is('deleted_at', null);
  
  if (uErr) {
    console.error('Error fetching users:', uErr);
    return;
  }

  const depts = Array.from(new Set(users.map(u => u.department).filter(Boolean)));
  console.log('Found unique departments to migrate:', depts);

  for (const dept of depts) {
    // 2. Find or Create Team
    let { data: team, error: tErr } = await supabase.from('teams').select('id').eq('name', dept).single();
    
    if (!team) {
      console.log(`Creating formal team for: ${dept}`);
      const { data: newTeam, error: cErr } = await supabase
        .from('teams')
        .insert([{ name: dept, description: `${dept} 조직의 공식 그룹입니다.` }])
        .select()
        .single();
      
      if (cErr) {
        console.error(`Error creating team ${dept}:`, cErr);
        continue;
      }
      team = newTeam;
    }

    // 3. Link users to this team
    if (team) {
      const { error: updErr } = await supabase
        .from('users')
        .update({ team_id: team.id })
        .eq('department', dept);
      
      if (updErr) console.error(`Error linking users to ${dept}:`, updErr);
      else console.log(`Successfully migrated users to team: ${dept}`);
    }
  }

  console.log('✅ Organization Migration Complete!');
}

migrate();
