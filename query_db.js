require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: apps, error } = await supabase.from('applications').select(`
    id,
    project:projects(
      name,
      pollution_category,
      business:businesses(sector)
    ),
    approvals:application_approvals(
      approval_type_id,
      status,
      scrutiny_level
    )
  `).order('created_at', { ascending: false }).limit(2);
  console.log(JSON.stringify(apps, null, 2));
}
run();
