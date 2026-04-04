import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placeId } = await req.json();
    console.log(`Fetching details for place ID: ${placeId}`);
    
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!placeId) {
      throw new Error('placeId is required');
    }

    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY is not set');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`
    );
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in get-place-details function:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unknown error occurred' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
