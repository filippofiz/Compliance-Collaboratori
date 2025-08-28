// Webhook per salvare eventi email Resend nel database
// Resend invia eventi quando: email.sent, email.delivered, email.opened, email.bounced

// @ts-ignore - Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verifica webhook signature (opzionale ma consigliato)
    const signature = req.headers.get('svix-signature')
    
    // Parse evento Resend
    const event = await req.json()
    
    // Inizializza Supabase Admin Client
    // @ts-ignore - Deno runtime
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    // @ts-ignore - Deno runtime
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Salva evento email nel database
    const logData = {
      collaboratore_id: event.data?.tags?.collaboratore_id || null,
      tipo_azione: `email_${event.type}`, // email_sent, email_delivered, etc.
      descrizione: `Email ${event.type}: ${event.data?.subject || 'N/A'}`,
      entita_tipo: 'email_log',
      entita_id: event.data?.id || null,
      valori_nuovi: {
        resend_id: event.data?.id,
        to: event.data?.to,
        from: event.data?.from,
        subject: event.data?.subject,
        status: event.type,
        timestamp: event.created_at,
        // Salva TUTTI i dati dell'evento
        full_event: event
      }
    }
    
    // Inserisci in audit_log
    const { error } = await supabase
      .from('audit_log')
      .insert([logData])
    
    if (error) {
      console.error('Errore salvataggio log:', error)
      throw error
    }
    
    // Se è un bounce o complaint, aggiorna lo stato del collaboratore
    if (event.type === 'email.bounced' || event.type === 'email.complained') {
      const email = event.data?.to?.[0]
      if (email) {
        await supabase
          .from('collaboratori')
          .update({ 
            note: `⚠️ Email problema: ${event.type} - ${new Date().toISOString()}` 
          })
          .eq('email', email)
      }
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})