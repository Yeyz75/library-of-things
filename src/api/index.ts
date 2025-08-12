// Exportar configuración base y utilidades
export * from './api';

// Exportar clases principales para fácil acceso
export { AuthAPI } from './auth';
export { DatabaseAPI } from './database';
export { StorageAPI } from './storage';

// Exportar APIs de recursos para fácil acceso
export { usersAPI } from './users';
export { itemsAPI } from './items';
export { reservationsAPI } from './reservations';
export { reviewsAPI } from './reviews';
export { userStatsAPI } from './userStats';
