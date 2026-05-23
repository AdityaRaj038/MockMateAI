import { createClient } from "@supabase/supabase-js";

// Edge functions live on the managed Lovable Cloud project.
// Even when the user connects their own Supabase for DB/auth, function
// calls must hit this fixed project where the functions are deployed.
const MANAGED_URL = "https://gqwotbtzqrpxikgfatwo.supabase.co";
const MANAGED_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd290YnR6cXJweGlrZ2ZhdHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDcxMjQsImV4cCI6MjA4NzUyMzEyNH0.x3TfNbwme8hcCG3JHAn4JkyoG-hySmO3mz-DTW7kl1M";

export const functionsClient = createClient(MANAGED_URL, MANAGED_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});