import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, content, mood, preferences, recentEntries, userGoals } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    // Personalize based on user preferences
    const userName = preferences?.displayName || 'friend';
    const promptStyle = preferences?.promptStyle || 'reflective';

    // Build goal context if available
    let goalContext = '';
    if (userGoals && userGoals.length > 0) {
      goalContext = ` Active goals: ${userGoals.map((g: any) => g.goal_text).join(', ')}.`;
    }

    if (action === 'prompt') {
      const stylePrompts = {
        reflective: 'Generate a thought-provoking prompt about self-discovery, emotions, or life patterns',
        creative: 'Generate an imaginative prompt that sparks creative thinking or storytelling',
        practical: 'Generate a practical prompt about goals, plans, or daily reflections'
      };

      systemPrompt = `You are a thoughtful companion helping ${userName} with their personal journal. Generate prompts that match their ${promptStyle} style. CRITICAL: Keep prompts to MAXIMUM 15 words. Be conversational and genuinely curious.${goalContext}`;
      userPrompt = stylePrompts[promptStyle as keyof typeof stylePrompts] || stylePrompts.reflective;
    } else if (action === 'insights') {
      // Build context from recent moods
      let moodContext = '';
      if (recentEntries && recentEntries.length > 0) {
        const recentMoods = recentEntries.filter((e: any) => e.mood).map((e: any) => e.mood);
        if (recentMoods.length > 0) {
          moodContext = ` Recent pattern: ${recentMoods.slice(0, 3).join(', ')}`;
        }
      }

      systemPrompt = `You are a personal data analyst for ${userName}'s journal. Analyze their entry objectively and provide factual feedback based on patterns, word frequency, or sentiment shifts. Be neutral and evidence-based. No motivational language or therapy speak. Format: "[Observation]" or "[Data point]"${moodContext}${goalContext}`;
      userPrompt = `Entry: "${content}". Analyze objectively and provide one measurable insight.${userGoals && userGoals.length > 0 ? ' If relevant to their goals, mention connection briefly.' : ''}`;
    } else if (action === 'mood') {
      systemPrompt = 'Detect the primary emotion using Ekman\'s 6 core survival emotions. Respond with ONLY ONE WORD from: happiness, sadness, fear, anger, surprise, disgust. These are evolutionary emotions that serve survival functions.';
      userPrompt = `Emotion in: "${content}"`;
    } else if (action === 'growth') {
      // Pattern analysis based on data
      systemPrompt = `You are a data analyst tracking ${userName}'s emotional patterns. Report trends, frequency shifts, and measurable changes. Be factual and specific. Use numbers, percentages, and timespans. No emotional language or advice—just observations from their data.${goalContext}`;
      userPrompt = `Analyze these patterns: ${JSON.stringify(recentEntries)}. Report measurable trends.${userGoals && userGoals.length > 0 ? ' Check progress toward goals if relevant.' : ''}`;
    } else if (action === 'accountability') {
      // Goal accountability check
      systemPrompt = `You are a data-driven accountability coach for ${userName}. Compare their recent activity against their goals. Be factual, specific, and gentle. Use evidence from their entries. Format: "[Observation about goal progress]" or "[Question to prompt reflection]"`;
      userPrompt = `Goals: ${JSON.stringify(userGoals)}. Recent entries: ${JSON.stringify(recentEntries)}. Provide one accountability nudge based on evidence.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage limit reached.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-diary-assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
