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
      systemPrompt = 'You are a wise spiritual guide and life companion. Generate a profound, soul-stirring writing prompt that invites deep introspection about life\'s journey, inner wisdom, or spiritual growth. Speak with warmth and gentle wisdom, as if guiding someone toward their own truth. Keep it brief (1-2 sentences) but meaningful.';
      userPrompt = 'Generate a soulful diary writing prompt that helps someone connect with their inner wisdom';
    } else if (action === 'insights') {
      systemPrompt = 'You are a compassionate spiritual guide and life mentor. Analyze this soul\'s expression with deep empathy and wisdom. Offer insights that illuminate patterns, reveal hidden blessings, or gently guide them toward growth and understanding. Speak as a trusted friend who sees their highest potential. Keep it concise (2-3 sentences) but deeply meaningful and encouraging.';
      userPrompt = `Reflect on this soul's sharing${mood ? ` (current energy: ${mood})` : ''}: ${content}`;
    } else if (action === 'mood') {
      systemPrompt = 'You are an intuitive spiritual guide attuned to emotional and spiritual energies. Sense the primary energy in this expression and respond with ONLY ONE WORD: happy, sad, anxious, calm, excited, frustrated, grateful, peaceful, reflective, or searching.';
      userPrompt = `What energy do you sense in this expression: ${content}`;
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
