// Supabase Edge Function per invio email con Resend
// Deploy con: supabase functions deploy send-email

// @ts-ignore - Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { type, to_email, to_name, data } = await req.json()

    // Get Resend API key from environment
    // @ts-ignore - Deno runtime
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      throw new Error('Resend API key not configured')
    }

    let subject = ''
    let htmlContent = ''
    
    // Prepare email based on type
    switch (type) {
      case 'documents_ready':
        subject = '📄 Documenti Compliance da Firmare - UpToTen'
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background: #f5f5f5;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 40px 30px; 
                text-align: center;
              }
              .header h1 { 
                font-size: 28px; 
                margin-bottom: 10px;
              }
              .content { 
                padding: 40px 30px;
              }
              .content h2 {
                color: #333;
                margin-bottom: 20px;
                font-size: 24px;
              }
              .content p {
                margin-bottom: 15px;
                color: #666;
              }
              .documents-box {
                background: #f9f9f9;
                border-left: 4px solid #667eea;
                padding: 20px;
                margin: 25px 0;
              }
              .documents-box h3 {
                color: #667eea;
                margin-bottom: 15px;
                font-size: 18px;
              }
              .documents-box ul {
                list-style: none;
              }
              .documents-box li {
                padding: 8px 0;
                color: #555;
              }
              .documents-box li:before {
                content: "📄 ";
                font-size: 16px;
              }
              .button-container {
                text-align: center;
                margin: 35px 0;
              }
              .button { 
                display: inline-block; 
                padding: 16px 40px; 
                background: #ee6c5f; 
                color: white !important; 
                text-decoration: none; 
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(238, 108, 95, 0.3);
              }
              .button:hover {
                background: #dc5a4d;
              }
              .notice {
                background: #fff9e6;
                border: 1px solid #ffd666;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .notice strong {
                color: #d48806;
              }
              .footer { 
                background: #f8f9fa;
                text-align: center; 
                padding: 30px;
                font-size: 13px; 
                color: #666;
                border-top: 1px solid #e9ecef;
              }
              .footer p {
                margin: 5px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>UpToTen Compliance</h1>
                <p style="margin: 0; opacity: 0.9;">Sistema di Gestione Documenti</p>
              </div>
              
              <div class="content">
                <h2>Ciao ${to_name}! 👋</h2>
                
                <p>I tuoi documenti di compliance sono pronti per essere firmati digitalmente.</p>
                
                <div class="documents-box">
                  <h3>Documenti da firmare:</h3>
                  <ul>
                    ${data.documenti || '<li>Dichiarazione di Indipendenza</li><li>Informativa Privacy</li><li>Consenso Trattamento Dati</li>'}
                  </ul>
                </div>
                
                <p>La firma è completamente digitale e richiede solo pochi minuti.</p>
                
                <div class="button-container">
                  <a href="${data.portal_link}" class="button">
                    Accedi al Portale Firma →
                  </a>
                </div>
                
                <div class="notice">
                  <strong>⏱️ Importante:</strong> Il link è valido per 7 giorni. La firma digitale è legalmente valida secondo il Regolamento eIDAS.
                </div>
                
                <p style="color: #999; font-size: 14px;">
                  Se il pulsante non funziona, copia e incolla questo link nel browser:<br>
                  <a href="${data.portal_link}" style="color: #667eea;">${data.portal_link}</a>
                </p>
              </div>
              
              <div class="footer">
                <p><strong>UpToTen SRL</strong></p>
                <p>Sistema Compliance Aziendale</p>
                <p>© 2025 Tutti i diritti riservati</p>
                <p style="margin-top: 15px; font-size: 12px;">
                  Questa è una comunicazione ufficiale relativa alla compliance aziendale.<br>
                  Per assistenza: support@uptoten.it
                </p>
              </div>
            </div>
          </body>
          </html>
        `
        break

      case 'verification':
        subject = '✅ Conferma la tua Firma Digitale - UpToTen'
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background: #f5f5f5;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              .header { 
                background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%); 
                color: white; 
                padding: 40px 30px; 
                text-align: center;
              }
              .header h1 { 
                font-size: 28px; 
                margin-bottom: 10px;
              }
              .content { 
                padding: 40px 30px;
              }
              .content h2 {
                color: #333;
                margin-bottom: 20px;
                font-size: 24px;
              }
              .content p {
                margin-bottom: 15px;
                color: #666;
              }
              .code-box {
                background: #f0f5ff;
                border: 2px dashed #1890ff;
                padding: 25px;
                border-radius: 10px;
                text-align: center;
                margin: 30px 0;
              }
              .code-box .label {
                font-size: 14px;
                color: #666;
                margin-bottom: 10px;
              }
              .code-box .code {
                font-size: 28px;
                font-weight: bold;
                color: #1890ff;
                letter-spacing: 2px;
                font-family: 'Courier New', monospace;
              }
              .button-container {
                text-align: center;
                margin: 35px 0;
              }
              .button { 
                display: inline-block; 
                padding: 16px 40px; 
                background: #52c41a; 
                color: white !important; 
                text-decoration: none; 
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(82, 196, 26, 0.3);
              }
              .button:hover {
                background: #389e0d;
              }
              .warning {
                background: #fff1f0;
                border: 1px solid #ffccc7;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .warning strong {
                color: #cf1322;
              }
              .steps {
                background: #f6ffed;
                border-left: 4px solid #52c41a;
                padding: 20px;
                margin: 25px 0;
              }
              .steps h3 {
                color: #52c41a;
                margin-bottom: 15px;
                font-size: 18px;
              }
              .steps ol {
                margin-left: 20px;
                color: #666;
              }
              .steps li {
                margin: 10px 0;
              }
              .footer { 
                background: #f8f9fa;
                text-align: center; 
                padding: 30px;
                font-size: 13px; 
                color: #666;
                border-top: 1px solid #e9ecef;
              }
              .footer p {
                margin: 5px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Conferma la tua Firma</h1>
                <p style="margin: 0; opacity: 0.9;">Ultimo step per completare</p>
              </div>
              
              <div class="content">
                <h2>Ciao ${to_name}! 👋</h2>
                
                <p>Hai appena firmato digitalmente i tuoi documenti di compliance.</p>
                <p><strong>Per completare il processo, conferma la tua identità cliccando sul pulsante sottostante:</strong></p>
                
                <div class="button-container">
                  <a href="${data.confirmation_link}" class="button">
                    Conferma la mia Firma ✓
                  </a>
                </div>
                
                <div class="code-box">
                  <div class="label">Oppure usa questo codice di verifica:</div>
                  <div class="code">${data.verification_code}</div>
                </div>
                
                <div class="steps">
                  <h3>Cosa succede dopo la conferma?</h3>
                  <ol>
                    <li>La tua firma diventa legalmente valida</li>
                    <li>I documenti vengono archiviati in modo sicuro</li>
                    <li>Ricevi una ricevuta con hash di verifica</li>
                    <li>Puoi scaricare i documenti firmati</li>
                  </ol>
                </div>
                
                <div class="warning">
                  <strong>⏱️ Attenzione:</strong> Questo link scade tra 24 ore. Dopo la scadenza dovrai firmare nuovamente i documenti.
                </div>
                
                <p style="color: #999; font-size: 14px;">
                  Se il pulsante non funziona, copia e incolla questo link nel browser:<br>
                  <a href="${data.confirmation_link}" style="color: #52c41a;">${data.confirmation_link}</a>
                </p>
              </div>
              
              <div class="footer">
                <p><strong>UpToTen SRL</strong></p>
                <p>Sistema Compliance Aziendale</p>
                <p style="margin-top: 15px; font-size: 12px;">
                  Non hai richiesto questa email? Puoi ignorare questo messaggio in sicurezza.<br>
                  Per assistenza: support@uptoten.it
                </p>
              </div>
            </div>
          </body>
          </html>
        `
        break

      case 'documents_completed':
        subject = '✅ Documenti Firmati - Ricevuta UpToTen'
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Firma Completata con Successo!</h1>
            </div>
            <div style="padding: 30px; background: #f5f5f5;">
              <h2>Complimenti ${to_name}!</h2>
              <p>Hai completato con successo la firma digitale dei seguenti documenti:</p>
              
              <div style="background: white; border-left: 4px solid #52c41a; padding: 15px; margin: 20px 0;">
                <h3>📄 Documenti Firmati:</h3>
                <ul>${data.documenti_list}</ul>
              </div>
              
              <div style="background: #f0f8ff; border: 1px solid #1890ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4>🔐 Dettagli Firma Digitale:</h4>
                <p><strong>Codici verifica:</strong> ${data.verification_codes}</p>
                <p><strong>Hash documenti:</strong> ${data.hash_codes || 'SHA-256 generato'}</p>
                <p><strong>Data validazione:</strong> ${new Date().toLocaleString('it-IT')}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.download_link}" style="background: #1890ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  📥 Scarica Documenti Firmati
                </a>
              </div>
              
              <div style="background: #fff9e6; border: 1px solid #ffd666; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>⚖️ Nota Legale:</strong></p>
                <p>I documenti firmati sono legalmente validi ai sensi del Regolamento eIDAS (UE) n. 910/2014. 
                Conserva questa email come ricevuta della firma digitale.</p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
                <p>Grazie per aver completato il processo di compliance!</p>
                <p><strong>Team UpToTen</strong></p>
              </div>
            </div>
          </body>
          </html>
        `
        break

      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    // Prepara payload con tags per tracking
    const emailPayload = {
      from: 'Documenti UpToTen <noreply@documenti.up2ten.it>',  // Nome personalizzato!
      to: [to_email],
      subject: subject,
      html: htmlContent,
      tags: {
        collaboratore_id: data.collaboratore_id || '',
        tipo: type,
        timestamp: new Date().toISOString()
      }
    }
    
    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(result)}`)
    }

    // Salva log email nel database per conservazione permanente
    try {
      // @ts-ignore - Deno runtime
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      // @ts-ignore - Deno runtime  
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (supabaseUrl && supabaseServiceKey) {
        // @ts-ignore - Dynamic import for Deno runtime
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3')
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        // Salva in audit_log con tutti i dettagli
        await supabase.from('audit_log').insert([{
          collaboratore_id: data.collaboratore_id || null,
          tipo_azione: `email_sent_${type}`,
          descrizione: `Email inviata: ${subject} a ${to_email}`,
          entita_tipo: 'email',
          entita_id: result.id,
          valori_nuovi: {
            resend_id: result.id,
            to: to_email,
            subject: subject,
            tipo: type,
            data_invio: new Date().toISOString()
          }
        }])
      }
    } catch (logError) {
      console.error('Errore salvataggio log email:', logError)
      // Non bloccare l'invio email se il log fallisce
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: result.id,
        result: result 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})