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
    const { action, content, recentEntries, userGoals } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'mirror') {
      // Mirror System: Analyze through all 5 lenses
      systemPrompt = `You are the Mirror System. Analyze this memory through exactly 5 lenses and return a JSON object with this structure:
{
  "love": { "detected": boolean, "signal": "brief observation about connection/people/relationships" },
  "energy": { "detected": boolean, "signal": "brief observation about vitality/rhythm/momentum" },
  "work": { "detected": boolean, "signal": "brief observation about creation/mastery/building" },
  "growth": { "detected": boolean, "signal": "brief observation about learning/evolution/awareness" },
  "satisfaction": { "detected": boolean, "signal": "brief observation about harmony/contentment/peace" }
}

Guidelines:
- Each signal must be under 15 words
- Use mechanical language: "Pattern shows", "Memory reveals", "Data indicates"
- Be factual and specific
- detected=true only if lens is clearly present in the memory`;
      userPrompt = `Memory: "${content}"`;
    } else if (action === 'mood') {
      systemPrompt = 'Detect the primary emotion using Ekman\'s 6 core survival emotions. Respond with ONLY ONE WORD from: happiness, sadness, fear, anger, surprise, disgust. These are evolutionary emotions that serve survival functions.';
      userPrompt = `Emotion in: "${content}"`;
    } else if (action === 'lens_reflection') {
      // Generate monthly lens-based reflection
      const lensName = content; // 'love', 'energy', 'work', 'growth', or 'satisfaction'
      const lensDescriptions = {
        love: 'Connection, belonging, emotional warmth - mentions of people, affection, empathy, care',
        energy: 'Vitality, rhythm, drive - words about rest, pace, momentum, tension, movement',
        work: 'Purpose, creation, mastery - verbs of building, striving, finishing, frustration, focus',
        growth: 'Evolution, learning, self-awareness - reflection language like "realized," "learned," "changed"',
        satisfaction: 'Harmony, balance, contentment - sentiment, calm language, closure phrases'
      };
      
      systemPrompt = `You are the ${lensName.toUpperCase()} Lens. Analyze these memories and generate ONE reflection (max 25 words) using mechanical language. Focus on: ${lensDescriptions[lensName as keyof typeof lensDescriptions]}. Use phrases like "Your pattern shows", "The data reveals", "Frequency indicates".`;
      userPrompt = `Memories: ${JSON.stringify(recentEntries)}. Generate reflection.`;
    }

    const requestBody: any = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    };

    // Use JSON mode for mirror analysis to ensure structured output
    if (action === 'mirror') {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
