import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FMEG_CATALOG = [
  { sku: 'REF-5STAR-450', name: '5-Star Frost-Free Refrigerator 450L', category: 'Refrigerators', specs: { energyRating: '5-star', capacity: '450L', type: 'Frost-free', warranty: '10 years' } },
  { sku: 'REF-4STAR-350', name: '4-Star Double Door Refrigerator 350L', category: 'Refrigerators', specs: { energyRating: '4-star', capacity: '350L', type: 'Direct cool', warranty: '5 years' } },
  { sku: 'REF-3STAR-250', name: '3-Star Single Door Refrigerator 250L', category: 'Refrigerators', specs: { energyRating: '3-star', capacity: '250L', type: 'Direct cool', warranty: '3 years' } },
  { sku: 'WM-5STAR-8KG', name: '5-Star Front Load Washing Machine 8kg', category: 'Washing Machines', specs: { energyRating: '5-star', capacity: '8kg', type: 'Front load', warranty: '5 years' } },
  { sku: 'WM-4STAR-7KG', name: '4-Star Top Load Washing Machine 7kg', category: 'Washing Machines', specs: { energyRating: '4-star', capacity: '7kg', type: 'Top load', warranty: '3 years' } },
  { sku: 'WM-SEMI-6KG', name: 'Semi-Automatic Washing Machine 6kg', category: 'Washing Machines', specs: { energyRating: '3-star', capacity: '6kg', type: 'Semi-automatic', warranty: '2 years' } },
  { sku: 'AC-5STAR-1.5T', name: '5-Star Inverter Split AC 1.5 Ton', category: 'Air Conditioners', specs: { energyRating: '5-star', capacity: '1.5 Ton', type: 'Inverter split', warranty: '5 years' } },
  { sku: 'AC-3STAR-1T', name: '3-Star Split AC 1 Ton', category: 'Air Conditioners', specs: { energyRating: '3-star', capacity: '1 Ton', type: 'Split', warranty: '3 years' } },
  { sku: 'AC-WIN-1.5T', name: 'Window AC 1.5 Ton', category: 'Air Conditioners', specs: { energyRating: '3-star', capacity: '1.5 Ton', type: 'Window', warranty: '2 years' } },
  { sku: 'TV-4K-55', name: '4K Smart LED TV 55 inch', category: 'Televisions', specs: { resolution: '4K UHD', size: '55 inch', type: 'Smart LED', warranty: '2 years' } },
  { sku: 'TV-FHD-43', name: 'Full HD Smart TV 43 inch', category: 'Televisions', specs: { resolution: 'Full HD', size: '43 inch', type: 'Smart LED', warranty: '2 years' } },
  { sku: 'MW-CONV-30', name: 'Convection Microwave Oven 30L', category: 'Microwaves', specs: { capacity: '30L', type: 'Convection', power: '900W', warranty: '2 years' } },
  { sku: 'MW-SOLO-20', name: 'Solo Microwave Oven 20L', category: 'Microwaves', specs: { capacity: '20L', type: 'Solo', power: '700W', warranty: '1 year' } },
  { sku: 'WH-INST-15', name: 'Instant Water Heater 15L', category: 'Water Heaters', specs: { capacity: '15L', type: 'Instant', power: '3000W', warranty: '5 years' } },
  { sku: 'WH-STOR-25', name: 'Storage Water Heater 25L', category: 'Water Heaters', specs: { capacity: '25L', type: 'Storage', power: '2000W', warranty: '7 years' } },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requirements, sensitivity = 0.7 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing product matching with sensitivity:', sensitivity);

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
            content: `You are an expert product matcher for FMEG (Fast-Moving Electrical Goods). 
            Match RFP requirements to products from the catalog.
            Consider energy ratings, specifications, capacity, and compliance requirements.
            Matching sensitivity: ${sensitivity} (0 = loose matching, 1 = strict matching).
            Return ONLY valid JSON array, no markdown.`
          },
          {
            role: 'user',
            content: `Match these RFP requirements to our product catalog:

Requirements:
${requirements}

Product Catalog:
${JSON.stringify(FMEG_CATALOG, null, 2)}

Return a JSON array with this exact structure for each match:
[
  {
    "sku": "product SKU",
    "name": "product name",
    "matchScore": 0-100,
    "matchReason": "why this product matches",
    "gapAnalysis": "any gaps or concerns",
    "recommended": true/false
  }
]

Sort by matchScore descending. Include all potentially matching products.`
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
    let matchesText = data.choices[0].message.content;
    
    // Clean up potential markdown formatting
    matchesText = matchesText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const matches = JSON.parse(matchesText);

    console.log('Product matching completed, found', matches.length, 'matches');

    return new Response(JSON.stringify({ matches, catalog: FMEG_CATALOG }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in product-match function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
