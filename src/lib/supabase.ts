import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = 'https://votvlazeacamcuuvwwfj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvdHZsYXplYWNhbWN1dXZ3d2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MDU0OTcsImV4cCI6MjA2NDI4MTQ5N30.I3oxIaXI_xF2IRMFV0BBtAF5kUAIZ997xSJeGd0XaTc';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);