import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, content, userId, recentMessages } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('[MEMORY] Action:', action, 'UserId:', userId);

    if (action === 'generate_surprise') {
      // Get user traits for personalization (lightweight)
      const { data: traits } = await supabase
        .from('user_traits')
        .select('themes, values, tone_preference')
        .eq('user_id', userId)
        .single();

      // Get last 3 relevant entries (simple query, no vector search yet)
      const { data: recentEntries } = await supabase
        .from('diary_entries')
        .select('content, mood, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Build lightweight context
      let systemPrompt = 'You are a personal data analyst providing objective insights.';
      
      if (traits?.themes && traits.themes.length > 0) {
        systemPrompt += ` Tracked patterns: ${traits.themes.slice(0, 3).join(', ')}.`;
      }
      // Only generate surprise 30% of the time (not every message)
      if (Math.random() < 0.30) {
        const surpriseTypes = ['quote', 'mirror', 'challenge'];
        // Add 'echo' only if we have past entries
        if (recentEntries && recentEntries.length > 0) {
          surpriseTypes.push('echo');
        }
        
        const surpriseType = surpriseTypes[Math.floor(Math.random() * surpriseTypes.length)];
        let surprisePrompt = '';
        
        if (surpriseType === 'quote') {
          surprisePrompt = 'Provide a research-backed fact or data point related to their entry. Include source. Format: "[Fact/statistic]" - Source. Under 35 words.';
        } else if (surpriseType === 'mirror') {
          surprisePrompt = `Count word frequency or identify pattern. Example: "The word 'X' appears Y times." Be factual. Under 25 words.`;
        } else if (surpriseType === 'challenge') {
          surprisePrompt = 'Suggest a measurable tracking experiment. Format: "Track: [specific metric]." Under 20 words.';
        } else if (surpriseType === 'echo' && recentEntries && recentEntries.length > 0) {
          const oldEntry = recentEntries[Math.floor(Math.random() * recentEntries.length)];
          const daysAgo = Math.floor((Date.now() - new Date(oldEntry.created_at).getTime()) / (1000 * 60 * 60 * 24));
          surprisePrompt = `${daysAgo} days ago: "${oldEntry.content.substring(0, 50)}..." vs today. Identify language shift or pattern change. Be specific. Under 35 words.`;
        }

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: surprisePrompt }
            ],
            temperature: 0.8,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const surpriseContent = aiData.choices[0].message.content;

          // Store the surprise reflection
          const { data: surprise } = await supabase
            .from('surprise_reflections')
            .insert({
              user_id: userId,
              reflection_type: surpriseType,
              content: surpriseContent,
              context: { entry_preview: content.substring(0, 100) },
            })
            .select()
            .single();

          return new Response(
            JSON.stringify({
              hasSurprise: true,
              surprise: surprise,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Background task: batch update traits (runs async, doesn't block)
    if (action === 'batch_update_memory') {
      console.log('[MEMORY] Starting background batch update for user:', userId);
      
      // Get last 10 entries that haven't been processed
      const { data: unprocessedEntries } = await supabase
        .from('diary_entries')
        .select('id, content, created_at')
        .eq('user_id', userId)
        .is('ai_insights', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (unprocessedEntries && unprocessedEntries.length > 0) {
        console.log('[MEMORY] Processing', unprocessedEntries.length, 'entries');
        
        // Batch extract themes from multiple entries
        const batchContent = unprocessedEntries.map(e => e.content).join('\n---\n');
        
        const traitsPrompt = `Analyze these ${unprocessedEntries.length} journal entries and extract:
- Common themes (3-5 words max each)
- Core values expressed
- Overall tone (playful/serious/balanced/reflective)

Entries:
${batchContent}

Respond in JSON: { "themes": [], "values": [], "tone": "" }`;

        try {
          const traitsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: 'Extract patterns from journal entries. Be concise.' },
                { role: 'user', content: traitsPrompt }
              ],
            }),
          });

          if (traitsResponse.ok) {
            const traitsData = await traitsResponse.json();
            const responseText = traitsData.choices[0].message.content;
            const jsonMatch = responseText.match(/```json\n(.*?)\n```/s) || responseText.match(/{.*}/s);
            const extractedTraits = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText);

            // Get current traits
            const { data: currentTraits } = await supabase
              .from('user_traits')
              .select('*')
              .eq('user_id', userId)
              .single();

            // Merge and limit
            const updatedThemes = [...new Set([...(currentTraits?.themes || []), ...(extractedTraits.themes || [])])].slice(0, 8);
            const updatedValues = [...new Set([...(currentTraits?.values || []), ...(extractedTraits.values || [])])].slice(0, 8);

            await supabase
              .from('user_traits')
              .upsert({
                user_id: userId,
                themes: updatedThemes,
                values: updatedValues,
                tone_preference: extractedTraits.tone || currentTraits?.tone_preference || 'balanced',
                last_updated: new Date().toISOString(),
              }, {
                onConflict: 'user_id'
              });

            console.log('[MEMORY] Traits updated:', updatedThemes.length, 'themes,', updatedValues.length, 'values');
          }
        } catch (e) {
          console.error('[MEMORY] Batch update error:', e);
        }
      }
    }

    return new Response(
      JSON.stringify({ hasSurprise: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[MEMORY] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});