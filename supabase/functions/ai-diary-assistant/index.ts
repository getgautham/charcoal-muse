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
    const { action, content, mood } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'prompt') {
      systemPrompt = 'You are a thoughtful diary assistant. Generate a creative, introspective writing prompt to help someone reflect on their day. Keep it brief (1-2 sentences) and thought-provoking.';
      userPrompt = 'Generate a diary writing prompt';
    } else if (action === 'insights') {
      systemPrompt = 'You are an empathetic diary analyst. Analyze the diary entry and provide brief, supportive insights about mood patterns, themes, or suggestions. Keep it concise (2-3 sentences) and encouraging.';
      userPrompt = `Analyze this diary entry${mood ? ` (mood: ${mood})` : ''}: ${content}`;
    } else if (action === 'mood') {
      systemPrompt = 'You are a mood analyzer. Based on the diary entry, respond with ONLY ONE WORD representing the primary mood: happy, sad, anxious, calm, excited, frustrated, grateful, or neutral.';
      userPrompt = `Analyze the mood of this entry: ${content}`;
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
