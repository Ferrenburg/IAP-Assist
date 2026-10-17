import { createClient } from '@supabase/supabase-js';
import { projectId, publishableKey } from './supabase-info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// supabase-js handles sending `apikey` header automatically; passing the
// publishable key as the second argument is the same call shape as before.
export const supabase = createClient(supabaseUrl, publishableKey);
