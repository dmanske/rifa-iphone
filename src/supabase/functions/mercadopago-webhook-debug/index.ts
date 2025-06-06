import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("🚀 WEBHOOK DEBUG CHAMADO!");
  console.log("Método:", req.method);
  console.log("URL:", req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Cliente Supabase
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Registrar que foi chamado
    await supabaseService
      .from('payment_logs')
      .insert({
        payment_id: 'webhook_debug_test',
        payload_raw: { 
          method: req.method,
          url: req.url,
          timestamp: new Date().toISOString(),
          message: "Webhook debug funcionando!"
        },
        fonte: 'mercadopago_webhook_debug',
        processado: true,
      });

    console.log("✅ Log registrado no banco!");

    return new Response(JSON.stringify({ 
      received: true, 
      status: 'debug_ok',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Erro:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 