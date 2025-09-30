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
    const { action, content, mood, preferences, recentEntries } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    // Personalize based on user preferences
    const userName = preferences?.displayName || 'friend';
    const promptStyle = preferences?.promptStyle || 'reflective';

    if (action === 'prompt') {
      const stylePrompts = {
        reflective: 'Generate a thought-provoking prompt about self-discovery, emotions, or life patterns',
        creative: 'Generate an imaginative prompt that sparks creative thinking or storytelling',
        practical: 'Generate a practical prompt about goals, plans, or daily reflections'
      };

      systemPrompt = `You are a thoughtful companion helping ${userName} with their personal journal. Generate prompts that match their ${promptStyle} style. Keep it conversational, brief (1-2 sentences), and genuinely curious.`;
      userPrompt = stylePrompts[promptStyle as keyof typeof stylePrompts] || stylePrompts.reflective;
    } else if (action === 'insights') {
      // Build context from recent entries
      let context = '';
      if (recentEntries && recentEntries.length > 0) {
        const recentMoods = recentEntries.filter((e: any) => e.mood).map((e: any) => e.mood);
        if (recentMoods.length > 0) {
          context = `\n\nRecent energy patterns: ${recentMoods.join(', ')}`;
        }
      }

      systemPrompt = `You are a perceptive companion who helps ${userName} understand themselves better. Analyze their writing with genuine empathy. Notice patterns, celebrate growth, and offer gentle insights that help them see themselves more clearly. Be conversational and supportive. Keep it concise (2-3 sentences) but meaningful.`;
      userPrompt = `${userName} just wrote this${mood ? ` (feeling ${mood})` : ''}: "${content}"${context}\n\nWhat do you notice? What might this tell them about themselves?`;
    } else if (action === 'mood') {
      systemPrompt = 'Detect the primary emotion. Respond with ONLY ONE WORD: happy, sad, anxious, calm, excited, frustrated, grateful, peaceful, reflective, hopeful, overwhelmed, or content.';
      userPrompt = `Emotion in: "${content}"`;
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
