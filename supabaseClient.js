// supabaseClient.js
const SUPABASE_URL = 'https://ubkorizenwfeoujzonzt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia29yaXplbndmZW91anpvbnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MDM5MjksImV4cCI6MjA2MzM3OTkyOX0.ezgG7MLSWQBYEdUQNEm6QvUGJRdH_vIMwhEQBhkeb5k';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
