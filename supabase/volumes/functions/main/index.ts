import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  const url = new URL(req.url)
  const functionName = url.pathname.split("/")[1]
  return new Response(
    JSON.stringify({ error: `Function ${functionName} not found` }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  )
})
