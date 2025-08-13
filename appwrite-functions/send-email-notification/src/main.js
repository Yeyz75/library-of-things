import { Client, Messaging } from 'node-appwrite';

// Configuración de Appwrite
const client = new Client()
  .setEndpoint(
    process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://cloud.appwrite.io/v1'
  )
  .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const messaging = new Messaging(client);

// Templates de email
const EMAIL_TEMPLATES = {
  'new-reservation': {
    subject: 'Nueva solicitud de préstamo: {{itemTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center; color: white;">
          <h1>📦 Nueva Solicitud de Préstamo</h1>
          <p>Alguien quiere tomar prestado tu item</p>
        </div>
        
        <div style="padding: 32px;">
          <h2>¡Hola {{ownerName}}! 👋</h2>
          
          <p><strong>{{borrowerName}}</strong> ha solicitado tomar prestado tu item <strong>{{itemTitle}}</strong>.</p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
            <h4>📅 Detalles de la Reserva</h4>
            <p><strong>Fecha de inicio:</strong> {{startDate}}</p>
            <p><strong>Fecha de devolución:</strong> {{endDate}}</p>
            <p><strong>Solicitante:</strong> {{borrowerName}}</p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="{{actionUrl}}&decision=approve" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 8px; display: inline-block;">
              ✅ Aprobar Solicitud
            </a>
            <a href="{{actionUrl}}&decision=reject" style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 8px; display: inline-block;">
              ❌ Rechazar Solicitud
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p><strong>Library of Things</strong></p>
          <p>Construyendo comunidades más sostenibles</p>
        </div>
      </div>
    `,
  },

  'reservation-approved': {
    subject: '¡Reserva aprobada! {{itemTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center; color: white;">
          <h1>🎉 ¡Reserva Aprobada!</h1>
          <p>Tu solicitud ha sido aceptada</p>
        </div>
        
        <div style="padding: 32px;">
          <h2>¡Excelentes noticias, {{borrowerName}}! 🎊</h2>
          
          <div style="background: #10b981; color: white; padding: 12px 24px; border-radius: 50px; display: inline-block; margin-bottom: 24px;">
            ✅ Solicitud Aprobada
          </div>
          
          <p><strong>{{ownerName}}</strong> ha aprobado tu solicitud para <strong>{{itemTitle}}</strong>.</p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
            <h4>📅 Detalles de tu Reserva</h4>
            <p><strong>Fecha de recogida:</strong> {{startDate}}</p>
            <p><strong>Fecha de devolución:</strong> {{endDate}}</p>
            <p><strong>Propietario:</strong> {{ownerName}}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="{{reservationUrl}}" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">
              📱 Ver Reserva Completa
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 24px; text-align: center;">
          <p><strong>Library of Things</strong></p>
          <p>¡Disfruta tu préstamo!</p>
        </div>
      </div>
    `,
  },

  'reservation-rejected': {
    subject: 'Reserva no aprobada: {{itemTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center; color: white;">
          <h1>📋 Solicitud Revisada</h1>
          <p>Información sobre tu solicitud</p>
        </div>
        
        <div style="padding: 32px;">
          <h2>Hola {{borrowerName}} 👋</h2>
          
          <p>Lamentamos informarte que <strong>{{ownerName}}</strong> no ha podido aprobar tu solicitud para <strong>{{itemTitle}}</strong> en este momento.</p>
          
          <div style="text-align: center;">
            <a href="{{exploreUrl}}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">
              🔍 Explorar Otros Items
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 24px; text-align: center;">
          <p><strong>Library of Things</strong></p>
          <p>Seguimos aquí para ayudarte</p>
        </div>
      </div>
    `,
  },

  'loan-reminder': {
    subject: 'Recordatorio: Tu préstamo de {{itemTitle}} comienza mañana',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px; text-align: center; color: white;">
          <h1>⏰ Recordatorio</h1>
          <p>Tu préstamo comienza pronto</p>
        </div>
        
        <div style="padding: 32px;">
          <h2>¡Hola {{recipientName}}! 👋</h2>
          
          <div style="background: #fbbf24; color: #92400e; padding: 16px; border-radius: 12px; text-align: center; margin: 24px 0; font-weight: bold;">
            🗓️ ¡Tu préstamo comienza mañana!
          </div>
          
          <p>Te recordamos que mañana comienza tu préstamo de <strong>{{itemTitle}}</strong>.</p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
            <h4>📅 Detalles del Préstamo</h4>
            <p><strong>Fecha de inicio:</strong> {{startDate}}</p>
            <p><strong>Fecha de devolución:</strong> {{endDate}}</p>
            <p><strong>Contacto:</strong> {{contactName}} ({{contactEmail}})</p>
          </div>
          
          <div style="text-align: center;">
            <a href="{{reservationUrl}}" style="background: #8b5cf6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">
              📱 Ver Detalles Completos
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 24px; text-align: center;">
          <p><strong>Library of Things</strong></p>
          <p>Facilitando el intercambio responsable</p>
        </div>
      </div>
    `,
  },

  'return-confirmation': {
    subject: 'Devolución confirmada: {{itemTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center; color: white;">
          <h1>✅ ¡Completado!</h1>
          <p>Devolución confirmada exitosamente</p>
        </div>
        
        <div style="padding: 32px;">
          <h2>¡Hola {{recipientName}}! 🎉</h2>
          
          <p>¡Gracias por completar exitosamente el préstamo de <strong>{{itemTitle}}</strong>!</p>
          
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; margin: 24px 0; text-align: center;">
            <h4>⭐ ¡Tu Opinión Importa!</h4>
            <p style="color: #0369a1;">Ayuda a otros usuarios compartiendo tu experiencia.</p>
            <a href="{{reviewUrl}}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">
              ✍️ Escribir Reseña
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 24px; text-align: center;">
          <p><strong>Library of Things</strong></p>
          <p>Celebrando otro intercambio exitoso</p>
        </div>
      </div>
    `,
  },
};

// Función para interpolar variables en templates
function interpolateTemplate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}

// Función principal
export default async ({ req, res, log, error }) => {
  try {
    // Parsear datos de entrada
    const data = JSON.parse(req.body || '{}');
    const { to, subject, templateId, templateData } = data;

    // Validar datos requeridos
    if (!to || !templateId) {
      error('Missing required fields: to, templateId');
      return res.json({ success: false, error: 'Missing required fields' });
    }

    // Obtener template
    const template = EMAIL_TEMPLATES[templateId];
    if (!template) {
      error(`Template ${templateId} not found`);
      return res.json({ success: false, error: 'Template not found' });
    }

    // Interpolar template
    const emailSubject = interpolateTemplate(
      subject || template.subject,
      templateData || {}
    );
    const emailHtml = interpolateTemplate(template.html, templateData || {});

    // Enviar email usando Appwrite Messaging
    try {
      const message = await messaging.createEmail(
        'unique()', // messageId
        emailSubject,
        emailHtml,
        [], // topics (vacío para envío directo)
        [to], // users
        [], // targets
        [], // cc
        [], // bcc
        [], // attachments
        false, // draft
        emailHtml, // html
        null // scheduledAt
      );

      log(`Email sent successfully to ${to} with template ${templateId}`);

      return res.json({
        success: true,
        messageId: message.$id,
        message: 'Email sent successfully',
      });
    } catch (messagingError) {
      error(`Messaging error: ${messagingError.message}`);

      // Fallback: log the email content for debugging
      log(`Email content for ${to}:`);
      log(`Subject: ${emailSubject}`);
      log(`HTML: ${emailHtml}`);

      return res.json({
        success: false,
        error: 'Failed to send email via messaging service',
        details: messagingError.message,
      });
    }
  } catch (parseError) {
    error(`Parse error: ${parseError.message}`);
    return res.json({
      success: false,
      error: 'Invalid request data',
      details: parseError.message,
    });
  }
};
