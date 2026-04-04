import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';

const BodySchema = z.object({
  user_id: z.string().uuid(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  message: z.string().optional(),
  from_phone: z.string().min(1),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
    if (!TWILIO_API_KEY) throw new Error('TWILIO_API_KEY is not configured');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: corsHeaders });
    }

    const { user_id, lat, lng, message, from_phone } = parsed.data;

    // Get emergency contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user_id);

    if (contactsError) throw new Error(`Failed to get contacts: ${contactsError.message}`);
    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ error: 'No emergency contacts found', sent: 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Log SOS event
    await supabase.from('sos_events').insert({
      user_id,
      location_lat: lat,
      location_lng: lng,
      message: message || 'SOS triggered',
      status: 'triggered',
    });

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user_id)
      .single();

    const userName = profile?.full_name || 'A SafeHer user';
    const locationStr = lat && lng ? `\nLocation: https://maps.google.com/?q=${lat},${lng}` : '';
    const smsBody = `🆘 EMERGENCY ALERT from ${userName}!\n${message || 'SOS has been triggered.'}${locationStr}\n\nThis is an automated alert from SafeHer.`;

    // Send SMS to each contact
    const results = [];
    for (const contact of contacts) {
      try {
        const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': TWILIO_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: contact.phone,
            From: from_phone,
            Body: smsBody,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.error(`Failed to send SMS to ${contact.phone}:`, data);
          results.push({ contact: contact.name, status: 'failed', error: data.message });
        } else {
          results.push({ contact: contact.name, status: 'sent', sid: data.sid });
        }
      } catch (err) {
        console.error(`Error sending to ${contact.phone}:`, err);
        results.push({ contact: contact.name, status: 'error' });
      }
    }

    return new Response(JSON.stringify({ success: true, sent: results.filter(r => r.status === 'sent').length, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('SOS SMS error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
