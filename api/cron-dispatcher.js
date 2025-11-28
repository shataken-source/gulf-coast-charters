// Cron dispatcher - runs scheduled tasks
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const { job } = await req.json()
  
  switch (job) {
    case 'weather-alerts':
      // Trigger weather alerts check
      break
    case 'daily-digest':
      // Send daily emails
      break
    default:
      return new Response('Unknown job', { status: 400 })
  }
  
  return new Response(JSON.stringify({ success: true }))
})
