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
    const { rfpSummary, matchedProducts, pricing, companyName = 'FMEG Solutions Inc.' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating proposal for matched products');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert proposal writer for FMEG (Fast-Moving Electrical Goods) companies.
            Generate professional, compelling RFP response proposals.
            Use formal business language, highlight value propositions, and address all requirements.
            Include sections: Executive Summary, Technical Compliance, Product Details, Pricing Summary, Warranty & Support, Implementation Timeline.`
          },
          {
            role: 'user',
            content: `Generate a comprehensive RFP response proposal with the following details:

Company: ${companyName}

RFP Summary:
${rfpSummary}

Matched Products:
${JSON.stringify(matchedProducts, null, 2)}

Pricing Details:
${JSON.stringify(pricing, null, 2)}

Generate a complete, professional proposal response that:
1. Addresses all RFP requirements
2. Highlights product strengths and compliance
3. Provides clear pricing breakdown
4. Includes warranty and support commitments
5. Proposes implementation timeline
6. Adds value-added services

Format the response in clean, professional markdown.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const proposal = data.choices[0].message.content;

    console.log('Proposal generation completed successfully');

    return new Response(JSON.stringify({ proposal }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in generate-proposal function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
