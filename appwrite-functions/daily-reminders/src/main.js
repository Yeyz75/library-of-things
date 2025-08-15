import { Client, Databases, Functions, Query } from 'node-appwrite';

// Configuración de Appwrite
const client = new Client()
  .setEndpoint(
    process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1'
  )
  .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const functions = new Functions(client);

export default async ({ res, log, error }) => {
  try {
    log('Starting daily reminders process...');

    // Calcular fecha de mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    log(`Looking for reservations starting on: ${tomorrowStr}`);

    // Obtener reservas que comienzan mañana
    const reservations = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'library',
      process.env.APPWRITE_RESERVATIONS_COLLECTION_ID || 'reservations',
      [Query.equal('startDate', tomorrowStr), Query.equal('status', 'approved')]
    );

    log(
      `Found ${reservations.documents.length} reservations starting tomorrow`
    );

    let processedCount = 0;
    let errorCount = 0;

    // Procesar cada reserva
    for (const reservation of reservations.documents) {
      try {
        log(`Processing reservation ${reservation.$id}`);

        // Obtener datos del item, borrower y owner
        const [item, borrower, owner] = await Promise.all([
          databases.getDocument(
            process.env.APPWRITE_DATABASE_ID || 'library',
            process.env.APPWRITE_ITEMS_COLLECTION_ID || 'items',
            reservation.itemId
          ),
          databases.getDocument(
            process.env.APPWRITE_DATABASE_ID || 'library',
            process.env.APPWRITE_USERS_COLLECTION_ID || 'users',
            reservation.borrowerId
          ),
          databases.getDocument(
            process.env.APPWRITE_DATABASE_ID || 'library',
            process.env.APPWRITE_USERS_COLLECTION_ID || 'users',
            reservation.ownerId
          ),
        ]);

        // Enviar recordatorio usando la función de email
        const emailResult = await functions.createExecution(
          'send-email-notification',
          JSON.stringify({
            to: borrower.email,
            templateId: 'loan-reminder',
            templateData: {
              recipientName: borrower.name,
              itemTitle: item.title,
              startDate: reservation.startDate,
              endDate: reservation.endDate,
              contactName: owner.name,
              contactEmail: owner.email,
              reservationUrl: `${process.env.FRONTEND_URL}/reservations/${reservation.$id}`,
            },
          })
        );

        if (emailResult.status === 'completed') {
          processedCount++;
          log(
            `✓ Sent reminder for reservation ${reservation.$id} to ${borrower.email}`
          );
        } else {
          errorCount++;
          error(
            `✗ Failed to send reminder for reservation ${reservation.$id}: ${emailResult.errors}`
          );
        }
      } catch (err) {
        error(
          `✗ Error processing reservation ${reservation.$id}: ${err.message}`
        );
        errorCount++;
      }
    }

    const resultMessage = `Reminders process completed: ${processedCount} sent, ${errorCount} errors`;
    log(resultMessage);

    return res.json({
      success: true,
      processed: processedCount,
      errors: errorCount,
      message: resultMessage,
    });
  } catch (err) {
    const errorMessage = `Daily reminders error: ${err.message}`;
    error(errorMessage);
    return res.json({
      success: false,
      error: errorMessage,
    });
  }
};
