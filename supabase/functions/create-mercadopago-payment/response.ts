
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function createErrorResponse(error: string, debug: string, status: number = 400) {
  return new Response(JSON.stringify({ 
    error,
    debug,
    success: false
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

export function createSuccessResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}
