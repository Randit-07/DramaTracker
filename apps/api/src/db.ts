import { createClient } from "@supabase/supabase-js";
import { getConfig } from "./config.js";

const { supabaseUrl, supabaseServiceKey } = getConfig();

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
