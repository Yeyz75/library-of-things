// Exportar configuración base y utilidades
export * from './api';

// Exportar módulos específicos
export * from './auth';
/* export * from './database'; */
export * from './storage';

// Exportar recursos específicos
export * from './users';
/* export * from './items';
export * from './reservations';
export * from './reviews';
export * from './userStats'; */

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
