import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJiraConfig() {
  const { data, error } = await supabase
    .from("workspace_extensions")
    .select("*")
    .eq("ext_name", "jira")
    .single();

  if (error) {
    console.error("Error fetching jira config:", error);
    return;
  }

  console.log("--- JIRA CONFIG IN DB ---");
  console.log("Active Status:", data.is_active);
  console.log("Config Object:", JSON.stringify(data.config, null, 2));
  console.log("------------------------");
}

checkJiraConfig();
