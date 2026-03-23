import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://knssuivelqfmajmvkfqj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtuc3N1aXZlbHFmbWFqbXZrZnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjQ4ODgsImV4cCI6MjA4ODk0MDg4OH0.hkJQS3B_7kta2DPIGv81BIQG1TYdfzltR5K2Aeg6zA4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("Testing Supabase connection...");

    // Try inserting a row using upsert (works even if table exists)
    console.log("Trying to upsert initial row...");
    const { data, error } = await supabase
        .from('feature_usage')
        .upsert([{ id: 1, visits: 0, tts: 0, stt: 0 }], { onConflict: 'id' })
        .select();

    if (error) {
        console.error("Error:", JSON.stringify(error, null, 2));
        return;
    }
    console.log("Success! Row:", data);

    // Now try incrementing visits
    console.log("\nTrying to increment visits...");
    const { data: updData, error: updError } = await supabase
        .from('feature_usage')
        .update({ visits: 1 })
        .eq('id', 1)
        .select();

    if (updError) {
        console.error("Update error:", JSON.stringify(updError, null, 2));
    } else {
        console.log("Update success:", updData);
    }
}

testConnection();
