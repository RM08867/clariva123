import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Increment a specific feature count in the feature_usage table.
 * @param {'visits' | 'tts' | 'stt'} featureColumn The column to increment
 */
export const incrementFeatureCount = async (featureColumn) => {
    try {
        // Fetch current count
        const { data, error: fetchError } = await supabase
            .from('feature_usage')
            .select(featureColumn)
            .eq('id', 1)
            .single();

        if (fetchError) throw fetchError;

        const currentCount = data[featureColumn] || 0;

        // Update with incremented count
        const updatePayload = { [featureColumn]: currentCount + 1 };
        const { error: updateError } = await supabase
            .from('feature_usage')
            .update(updatePayload)
            .eq('id', 1);

        if (updateError) throw updateError;
        
        console.log(`Incremented ${featureColumn} successfully.`);
    } catch (err) {
        console.error(`Error incrementing ${featureColumn}:`, err);
    }
};
