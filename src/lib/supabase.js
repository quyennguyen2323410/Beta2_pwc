import { createClient } from "@supabase/supabase-js";

// Thông tin Supabase mặc định (Fallback khi chưa cấu hình file .env hoặc trên môi trường Production)
const DEFAULT_SUPABASE_URL = "https://xgzynrjlwvwwdlpwrtnu.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhnenlucmpsd3Z3d2RscHdydG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNjY0OTUsImV4cCI6MjEwNDk0MjQ5NX0.NDG1wxKumHwel8b2PW83wwOJdjk8UPzCiD8HP5qDoIw";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.info(
    "Lưu ý: Đang sử dụng cấu hình Supabase mặc định của hệ thống.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
