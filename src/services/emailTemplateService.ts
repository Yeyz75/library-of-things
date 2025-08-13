import type { EmailTemplateType } from './emailService';

/**
 * Servicio para manejar templates de email
 */
export class EmailTemplateService {
  private static templates: Map<EmailTemplateType, string> = new Map();

  /**
   * Carga un template de email
   */
  static async loadTemplate(templateId: EmailTemplateType): Promise<string> {
    // Si ya está en caché, devolverlo
    if (this.templates.has(templateId)) {
      return this.templates.get(templateId)!;
    }

    try {
      // En un entorno real, esto cargaría desde el servidor o CDN
      // Por ahora, devolvemos templates básicos
      const template = await this.getTemplateContent(templateId);
      this.templates.set(templateId, template);
      return template;
    } catch (error) {
      console.error(`Error loading template ${templateId}:`, error);
      return this.getFallbackTemplate();
    }
  }

  /**
   * Renderiza un template con datos
   */
  static async renderTemplate(
    templateId: EmailTemplateType,
    data: Record<string, unknown>
  ): Promise<string> {
    const template = await this.loadTemplate(templateId);
    return this.interpolateTemplate(template, data);
  }

  /**
   * Obtiene el contenido del template
   */
  private static async getTemplateContent(
    templateId: EmailTemplateType
  ): Promise<string> {
    // En un entorno real, esto haría fetch a los archivos HTML
    // Por ahora, devolvemos templates simplificados
    switch (templateId) {
      case 'new-reservation':
        return this.getNewReservationTemplate();
      case 'reservation-approved':
        return this.getReservationApprovedTemplate();
      case 'reservation-rejected':
        return this.getReservationRejectedTemplate();
      case 'loan-reminder':
        return this.getLoanReminderTemplate();
      case 'return-confirmation':
        return this.getReturnConfirmationTemplate();
      default:
        throw new Error(`Template ${templateId} not found`);
    }
  }

  /**
   * Interpola variables en el template
   */
  private static interpolateTemplate(
    template: string,
    data: Record<string, unknown>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return String(data[key] || match);
    });
  }

  /**
   * Template para nueva reserva
   */
  private static getNewReservationTemplate(): string {
    return `
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
          
          {{#if message}}
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 24px 0; font-style: italic;">
            <strong>Mensaje del solicitante:</strong><br>
            "{{message}}"
          </div>
          {{/if}}
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="{{actionUrl}}&decision=approve" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 8px; display: inline-block;">
              ✅ Aprobar Solicitud
            </a>
            <a href="{{actionUrl}}&decision=reject" style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 8px; display: inline-block;">
              ❌ Rechazar Solicitud
            </a>
          </div>
          
          <p style="text-align: center;">
            <a href="{{reservationUrl}}" style="color: #6b7280; text-decoration: none; border: 2px solid #d1d5db; padding: 12px 24px; border-radius: 8px;">
              👁️ Ver Detalles Completos
            </a>
          </p>
        </div>
        
        <div style="background: #f3f4f6; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p><strong>Library of Things</strong></p>
          <p>Construyendo comunidades más sostenibles</p>
        </div>
      </div>
    `;
  }

  /**
   * Template para reserva aprobada
   */
  private static getReservationApprovedTemplate(): string {
    return `
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
          
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; margin: 24px 0;">
            <h4>🚀 Próximos Pasos</h4>
            <ul style="color: #0369a1;">
              <li>Contacta con {{ownerName}} para coordinar la entrega</li>
              <li>Confirma el lugar y hora de recogida</li>
              <li>Revisa el estado del item al recibirlo</li>
              <li>Disfruta tu préstamo y cuídalo bien</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="{{reservationUrl}}" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">
              📱 Ver Reserva Completa
            </a>
          </div>
          
          <p style="background: #f8fafc; padding: 16px; margin: 24px 0; font-size: 14px;">
            <strong>Información de contacto:</strong><br>
            {{contactInfo}}
          </p>
        </div>
        
        <div style="background: #f3f4f6; padding: 24px; text-align: center;">
          <p><strong>Library of Things</strong></p>
          <p>¡Disfruta tu préstamo!</p>
        </div>
      </div>
    `;
  }

  /**
   * Template para reserva rechazada
   */
  private static getReservationRejectedTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center; color: white;">
          <h1>📋 Solicitud Revisada</h1>
          <p>Información sobre tu solicitud</p>
        </div>
        
        <div style="padding: 32px;">
          <h2>Hola {{borrowerName}} 👋</h2>
          
          <div style="background: #f59e0b; color: white; padding: 12px 24px; border-radius: 50px; display: inline-block; margin-bottom: 24px;">
            ⏸️ Solicitud No Aprobada
          </div>
          
          <p>Lamentamos informarte que <strong>{{ownerName}}</strong> no ha podido aprobar tu solicitud para <strong>{{itemTitle}}</strong> en este momento.</p>
          
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; margin: 24px 0;">
            <h4>🔍 ¿Qué puedes hacer ahora?</h4>
            <ul style="color: #0369a1;">
              <li>Buscar items similares de otros usuarios</li>
              <li>Intentar con fechas diferentes</li>
              <li>Explorar alternativas en tu área</li>
              <li>Contactar directamente con el propietario</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="{{exploreUrl}}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">
              🔍 Explorar Otros Items
            </a>
          </div>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; margin: 24px 0; text-align: center;">
            <p style="color: #166534;">
              🌟 ¡No te desanimes! Hay muchos otros items increíbles esperando ser compartidos.
            </p>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 24px; text-align: center;">
          <p><strong>Library of Things</strong></p>
          <p>Seguimos aquí para ayudarte</p>
        </div>
      </div>
    `;
  }

  /**
   * Template para recordatorio de préstamo
   */
  private static getLoanReminderTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px; text-align: center; color: white;">
          <h1>⏰ Recordatorio</h1>
          <p>Tu préstamo comienza pronto</p>
        </div>
        
        <div style="padding: 32px;">
          <h2>¡Hola {{recipientName}}! 👋</h2>
          
          <div style="background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 50px; display: inline-block; margin-bottom: 24px;">
            🔔 Recordatorio de Préstamo
          </div>
          
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
          
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; margin: 24px 0;">
            <h4>✅ Lista de Verificación</h4>
            <ul style="color: #0369a1;">
              <li>Contactar para confirmar hora y lugar</li>
              <li>Revisar el estado del item</li>
              <li>Confirmar la fecha de devolución</li>
              <li>Guardar información de contacto</li>
            </ul>
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
    `;
  }

  /**
   * Template para confirmación de devolución
   */
  private static getReturnConfirmationTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center; color: white;">
          <h1>✅ ¡Completado!</h1>
          <p>Devolución confirmada exitosamente</p>
        </div>
        
        <div style="padding: 32px;">
          <h2>¡Hola {{recipientName}}! 🎉</h2>
          
          <div style="background: #10b981; color: white; padding: 12px 24px; border-radius: 50px; display: inline-block; margin-bottom: 24px;">
            ✅ Devolución Confirmada
          </div>
          
          <p>¡Gracias por completar exitosamente el préstamo de <strong>{{itemTitle}}</strong>!</p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
            <h4>📋 Resumen del Préstamo</h4>
            <p><strong>Fecha de devolución:</strong> {{returnDate}}</p>
            <p><strong>Estado:</strong> Completado ✅</p>
          </div>
          
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; margin: 24px 0; text-align: center;">
            <h4>⭐ ¡Tu Opinión Importa!</h4>
            <p style="color: #0369a1;">Ayuda a otros usuarios compartiendo tu experiencia.</p>
            <div style="font-size: 24px; margin: 12px 0;">⭐⭐⭐⭐⭐</div>
            <a href="{{reviewUrl}}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">
              ✍️ Escribir Reseña
            </a>
          </div>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 24px 0; text-align: center;">
            <h4 style="color: #166534;">🌟 ¡Gracias por Participar!</h4>
            <p style="color: #166534;">Gracias por ser parte de nuestra comunidad de intercambio responsable.</p>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 24px; text-align: center;">
          <p><strong>Library of Things</strong></p>
          <p>Celebrando otro intercambio exitoso</p>
        </div>
      </div>
    `;
  }

  /**
   * Template de fallback en caso de error
   */
  private static getFallbackTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h1>Library of Things</h1>
        <p>Tienes una nueva notificación relacionada con tus reservas.</p>
        <p>Por favor, visita la aplicación para ver los detalles completos.</p>
        <a href="${window.location.origin}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">
          Ver en la App
        </a>
      </div>
    `;
  }

  /**
   * Limpia la caché de templates
   */
  static clearCache(): void {
    this.templates.clear();
  }

  /**
   * Obtiene el asunto del email según el tipo de template
   */
  static getEmailSubject(
    templateId: EmailTemplateType,
    data: Record<string, unknown>
  ): string {
    switch (templateId) {
      case 'new-reservation':
        return `Nueva solicitud de préstamo: ${data.itemTitle}`;
      case 'reservation-approved':
        return `¡Reserva aprobada! ${data.itemTitle}`;
      case 'reservation-rejected':
        return `Reserva no aprobada: ${data.itemTitle}`;
      case 'loan-reminder':
        return `Recordatorio: Tu préstamo de ${data.itemTitle} comienza mañana`;
      case 'return-confirmation':
        return `Devolución confirmada: ${data.itemTitle}`;
      default:
        return 'Notificación de Library of Things';
    }
  }
}
