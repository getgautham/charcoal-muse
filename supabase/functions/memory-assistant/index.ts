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
    const { action, content, userId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('[MEMORY] Action:', action, 'UserId:', userId);

    // Generate embedding for the content
    const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-large',
        input: content,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('[MEMORY] Embedding error:', errorText);
      throw new Error(`Embedding failed: ${errorText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;
    
    // Store the embedding
    const { error: embeddingError } = await supabase
      .from('entry_embeddings')
      .insert({
        user_id: userId,
        content: content,
        embedding: embedding,
      });

    if (embeddingError) {
      console.error('[MEMORY] Error storing embedding:', embeddingError);
    }

    // Search for similar past entries
    const { data: similarEntries, error: searchError } = await supabase
      .rpc('search_similar_entries', {
        query_embedding: embedding,
        match_user_id: userId,
        match_threshold: 0.75,
        match_count: 3,
      });

    if (searchError) {
      console.error('[MEMORY] Search error:', searchError);
    }

    console.log('[MEMORY] Found', similarEntries?.length || 0, 'similar entries');

    // Get user traits for personalization
    const { data: traits } = await supabase
      .from('user_traits')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Build context for AI
    let systemPrompt = 'You are a thoughtful journaling assistant with long-term memory.';
    
    if (traits) {
      systemPrompt += `\n\nUser Profile:`;
      if (traits.themes && traits.themes.length > 0) {
        systemPrompt += `\nRecurring themes: ${traits.themes.join(', ')}`;
      }
      if (traits.values && traits.values.length > 0) {
        systemPrompt += `\nCore values: ${traits.values.join(', ')}`;
      }
      if (traits.tone_preference) {
        systemPrompt += `\nPreferred tone: ${traits.tone_preference}`;
      }
    }

    if (similarEntries && similarEntries.length > 0) {
      systemPrompt += `\n\nRelevant past entries:`;
      similarEntries.forEach((entry: any, i: number) => {
        systemPrompt += `\n${i + 1}. "${entry.content.substring(0, 100)}..." (${new Date(entry.created_at).toLocaleDateString()})`;
      });
    }

    if (action === 'generate_surprise') {
      // Decide if we should generate a surprise (33% chance)
      if (Math.random() < 0.33) {
        const surpriseTypes = ['quote', 'mirror', 'challenge', 'echo'];
        const surpriseType = surpriseTypes[Math.floor(Math.random() * surpriseTypes.length)];
        
        let surprisePrompt = '';
        
        if (surpriseType === 'quote') {
          surprisePrompt = 'Generate an inspiring, relevant quote (with author) that relates to their current reflection. Make it unexpected but meaningful.';
        } else if (surpriseType === 'mirror') {
          surprisePrompt = 'Create a gentle observation about a pattern you notice in their reflections. Start with "I notice..." Keep it insightful but not judgmental.';
        } else if (surpriseType === 'challenge') {
          surprisePrompt = 'Offer a tiny, actionable micro-challenge related to their reflection. Start with "Try this:" Keep it simple and achievable.';
        } else if (surpriseType === 'echo' && similarEntries && similarEntries.length > 0) {
          surprisePrompt = 'Compare their current entry with a relevant past entry. Show growth or change. Start with a date reference like "Three weeks ago..."';
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
              { role: 'user', content: `Current entry: "${content}"\n\n${surprisePrompt}` }
            ],
            max_tokens: 150,
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

    // Update user traits based on patterns
    if (action === 'update_traits') {
      // Extract potential themes and values from content
      const traitsPrompt = `Based on this journal entry, extract:
1. Key themes (max 3 words each)
2. Core values mentioned
3. Tone preference (playful/serious/balanced)

Entry: "${content}"

Respond in JSON: { "themes": [], "values": [], "tone": "" }`;

      const traitsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a pattern recognition assistant. Extract themes, values, and tone from journal entries.' },
            { role: 'user', content: traitsPrompt }
          ],
        }),
      });

      if (traitsResponse.ok) {
        const traitsData = await traitsResponse.json();
        let extractedTraits;
        try {
          const responseText = traitsData.choices[0].message.content;
          // Extract JSON from markdown code blocks if present
          const jsonMatch = responseText.match(/```json\n(.*?)\n```/s) || responseText.match(/{.*}/s);
          extractedTraits = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText);
        } catch (e) {
          console.error('[MEMORY] Failed to parse traits:', e);
          extractedTraits = { themes: [], values: [], tone: 'balanced' };
        }

        // Upsert user traits
        const currentTraits = traits || { themes: [], values: [], tone_preference: 'balanced' };
        const updatedThemes = [...new Set([...(currentTraits.themes || []), ...(extractedTraits.themes || [])])].slice(0, 10);
        const updatedValues = [...new Set([...(currentTraits.values || []), ...(extractedTraits.values || [])])].slice(0, 10);

        await supabase
          .from('user_traits')
          .upsert({
            user_id: userId,
            themes: updatedThemes,
            values: updatedValues,
            tone_preference: extractedTraits.tone || currentTraits.tone_preference,
            last_updated: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });
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