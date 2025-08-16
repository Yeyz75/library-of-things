import {
  COLLECTIONS,
  handleApiError,
  handleApiSuccess,
  type ApiResponse,
  type QueryOptions,
  type BaseEntity,
} from './api';
import { DatabaseService } from './database';
import type { User } from 'firebase/auth';

// Interfaz para el perfil de usuario
export interface UserProfile extends BaseEntity {
  email: string;
  name: string;
  emailVerified: boolean;
  avatar?: string;
  role: 'user' | 'admin';
  preferences: Record<string, unknown>;
  stats?: {
    itemsCreated: number;
    reservationsMade: number;
    reviewsGiven: number;
    rating: number;
  };
  // Campos adicionales para gestión
  phone?: string;
  location?: {
    address: string;
    coordinates?: [number, number];
  };
  bio?: string;
  isActive: boolean;
  lastLoginAt?: string;
  joinedAt: string;
}

// Interfaz para datos de creación de usuario
export interface CreateUserData {
  email: string;
  name: string;
  role?: 'user' | 'admin';
  phone?: string;
  bio?: string;
  location?: {
    address: string;
    coordinates?: [number, number];
  };
  preferences?: Record<string, unknown>;
}

// Interfaz para datos de actualización de usuario
export interface UpdateUserData {
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  location?: {
    address: string;
    coordinates?: [number, number];
  };
  preferences?: Record<string, unknown>;
  role?: 'user' | 'admin';
  isActive?: boolean;
}

// Interfaz para opciones de búsqueda de usuarios
export interface UserSearchOptions extends QueryOptions {
  role?: 'user' | 'admin';
  isActive?: boolean;
  hasAvatar?: boolean;
  minRating?: number;
  location?: string;
}

// Interfaz para estadísticas de usuario
export interface UserStats {
  itemsCreated: number;
  reservationsMade: number;
  reviewsGiven: number;
  rating: number;
  totalEarnings?: number;
  totalSpent?: number;
  completedReservations?: number;
}

// Validación de email
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Validación de nombre
export const validateName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  const trimmedName = name.trim();
  return trimmedName.length >= 2 && trimmedName.length <= 100;
};

// Validación de teléfono
export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
};

// Validación de rol
export const validateRole = (role: string): role is 'user' | 'admin' => {
  return role === 'user' || role === 'admin';
};

// Validación de coordenadas
export const validateCoordinates = (coordinates: [number, number]): boolean => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
  const [lat, lng] = coordinates;
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

// Función de validación completa para datos de usuario
export const validateUserData = (data: CreateUserData): string[] => {
  const errors: string[] = [];

  if (!validateEmail(data.email)) {
    errors.push('Email inválido');
  }

  if (!validateName(data.name)) {
    errors.push('Nombre debe tener entre 2 y 100 caracteres');
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Número de teléfono inválido');
  }

  if (data.role && !validateRole(data.role)) {
    errors.push('Rol debe ser "user" o "admin"');
  }

  if (
    data.location?.coordinates &&
    !validateCoordinates(data.location.coordinates)
  ) {
    errors.push('Coordenadas inválidas');
  }

  if (data.bio && typeof data.bio === 'string' && data.bio.length > 500) {
    errors.push('Biografía no puede exceder 500 caracteres');
  }

  return errors;
};

// Función de validación para datos de actualización
export const validateUpdateUserData = (data: UpdateUserData): string[] => {
  const errors: string[] = [];

  if (data.name !== undefined && !validateName(data.name)) {
    errors.push('Nombre debe tener entre 2 y 100 caracteres');
  }

  if (
    data.phone !== undefined &&
    data.phone !== null &&
    !validatePhone(data.phone)
  ) {
    errors.push('Número de teléfono inválido');
  }

  if (data.role !== undefined && !validateRole(data.role)) {
    errors.push('Rol debe ser "user" o "admin"');
  }

  if (
    data.location?.coordinates &&
    !validateCoordinates(data.location.coordinates)
  ) {
    errors.push('Coordenadas inválidas');
  }

  if (
    data.bio !== undefined &&
    typeof data.bio === 'string' &&
    data.bio.length > 500
  ) {
    errors.push('Biografía no puede exceder 500 caracteres');
  }

  return errors;
};

// Clase principal para gestión de usuarios
export class UsersService {
  // Crear perfil de usuario
  static async createUserProfile(
    userId: string,
    userData: CreateUserData
  ): Promise<ApiResponse<UserProfile>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<UserProfile>(new Error('ID de usuario requerido'));
    }

    // Validar datos
    const validationErrors = validateUserData(userData);
    if (validationErrors.length > 0) {
      return handleApiError<UserProfile>(
        new Error(`Datos inválidos: ${validationErrors.join(', ')}`)
      );
    }

    try {
      const now = new Date().toISOString();
      const userProfile: Omit<UserProfile, '$id' | 'createdAt' | 'updatedAt'> =
        {
          email: userData.email.trim().toLowerCase(),
          name: userData.name.trim(),
          emailVerified: false,
          role: userData.role || 'user',
          preferences: userData.preferences || {},
          phone: userData.phone?.trim(),
          location: userData.location,
          bio: userData.bio?.trim(),
          isActive: true,
          joinedAt: now,
          stats: {
            itemsCreated: 0,
            reservationsMade: 0,
            reviewsGiven: 0,
            rating: 0,
          },
        };

      return await DatabaseService.create<UserProfile>(
        COLLECTIONS.USERS,
        userProfile,
        userId.trim()
      );
    } catch (error) {
      return handleApiError<UserProfile>(error);
    }
  }

  // Obtener perfil de usuario por ID
  static async getUserProfile(
    userId: string
  ): Promise<ApiResponse<UserProfile>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<UserProfile>(new Error('ID de usuario requerido'));
    }

    try {
      return await DatabaseService.read<UserProfile>(
        COLLECTIONS.USERS,
        userId.trim()
      );
    } catch (error) {
      return handleApiError<UserProfile>(error);
    }
  }

  // Actualizar perfil de usuario
  static async updateUserProfile(
    userId: string,
    updateData: UpdateUserData
  ): Promise<ApiResponse<UserProfile>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<UserProfile>(new Error('ID de usuario requerido'));
    }

    // Validar datos de actualización
    const validationErrors = validateUpdateUserData(updateData);
    if (validationErrors.length > 0) {
      return handleApiError<UserProfile>(
        new Error(`Datos inválidos: ${validationErrors.join(', ')}`)
      );
    }

    try {
      // Limpiar datos opcionales
      const cleanedData: Partial<UserProfile> = {};

      if (updateData.name !== undefined) {
        cleanedData.name = updateData.name.trim();
      }
      if (updateData.phone !== undefined) {
        cleanedData.phone = updateData.phone?.trim() || undefined;
      }
      if (updateData.bio !== undefined) {
        cleanedData.bio = updateData.bio?.trim() || undefined;
      }
      if (updateData.avatar !== undefined) {
        cleanedData.avatar = updateData.avatar;
      }
      if (updateData.location !== undefined) {
        cleanedData.location = updateData.location;
      }
      if (updateData.preferences !== undefined) {
        cleanedData.preferences = updateData.preferences;
      }
      if (updateData.role !== undefined) {
        cleanedData.role = updateData.role;
      }
      if (updateData.isActive !== undefined) {
        cleanedData.isActive = updateData.isActive;
      }

      return await DatabaseService.update<UserProfile>(
        COLLECTIONS.USERS,
        userId.trim(),
        cleanedData
      );
    } catch (error) {
      return handleApiError<UserProfile>(error);
    }
  }

  // Eliminar usuario (marcar como inactivo)
  static async deactivateUser(
    userId: string
  ): Promise<ApiResponse<UserProfile>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<UserProfile>(new Error('ID de usuario requerido'));
    }

    try {
      return await DatabaseService.update<UserProfile>(
        COLLECTIONS.USERS,
        userId.trim(),
        { isActive: false }
      );
    } catch (error) {
      return handleApiError<UserProfile>(error);
    }
  }

  // Reactivar usuario
  static async activateUser(userId: string): Promise<ApiResponse<UserProfile>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<UserProfile>(new Error('ID de usuario requerido'));
    }

    try {
      return await DatabaseService.update<UserProfile>(
        COLLECTIONS.USERS,
        userId.trim(),
        { isActive: true }
      );
    } catch (error) {
      return handleApiError<UserProfile>(error);
    }
  }

  // Buscar usuarios con filtros avanzados
  static async searchUsers(
    options: UserSearchOptions = {}
  ): Promise<ApiResponse<{ documents: UserProfile[]; total: number }>> {
    try {
      const queryOptions: QueryOptions = {
        limit: options.limit,
        offset: options.offset,
        orderBy: options.orderBy || 'joinedAt',
        orderType: options.orderType || 'DESC',
        filters: [],
        search: options.search,
      };

      // Agregar filtros específicos
      if (options.role) {
        queryOptions.filters?.push(`role==${options.role}`);
      }

      if (options.isActive !== undefined) {
        queryOptions.filters?.push(`isActive==${options.isActive}`);
      }

      if (options.hasAvatar !== undefined) {
        // Para filtrar por presencia de avatar, necesitamos una consulta más compleja
        // Por ahora, lo manejamos en el cliente después de obtener los resultados
      }

      return await DatabaseService.query<UserProfile>(
        COLLECTIONS.USERS,
        queryOptions
      );
    } catch (error) {
      return handleApiError<{ documents: UserProfile[]; total: number }>(error);
    }
  }

  // Obtener usuarios por rol
  static async getUsersByRole(
    role: 'user' | 'admin',
    options: QueryOptions = {}
  ): Promise<ApiResponse<{ documents: UserProfile[]; total: number }>> {
    if (!validateRole(role)) {
      return handleApiError<{ documents: UserProfile[]; total: number }>(
        new Error('Rol inválido')
      );
    }

    try {
      const queryOptions: QueryOptions = {
        ...options,
        filters: [...(options.filters || []), `role==${role}`],
      };

      return await DatabaseService.query<UserProfile>(
        COLLECTIONS.USERS,
        queryOptions
      );
    } catch (error) {
      return handleApiError<{ documents: UserProfile[]; total: number }>(error);
    }
  }

  // Obtener usuarios activos
  static async getActiveUsers(
    options: QueryOptions = {}
  ): Promise<ApiResponse<{ documents: UserProfile[]; total: number }>> {
    try {
      const queryOptions: QueryOptions = {
        ...options,
        filters: [...(options.filters || []), 'isActive==true'],
      };

      return await DatabaseService.query<UserProfile>(
        COLLECTIONS.USERS,
        queryOptions
      );
    } catch (error) {
      return handleApiError<{ documents: UserProfile[]; total: number }>(error);
    }
  }

  // Buscar usuarios por nombre o email
  static async searchUsersByNameOrEmail(
    searchTerm: string,
    options: QueryOptions = {}
  ): Promise<ApiResponse<{ documents: UserProfile[]; total: number }>> {
    if (
      !searchTerm ||
      typeof searchTerm !== 'string' ||
      searchTerm.trim() === ''
    ) {
      return handleApiError<{ documents: UserProfile[]; total: number }>(
        new Error('Término de búsqueda requerido')
      );
    }

    try {
      // Buscar por nombre primero
      const nameSearchOptions: QueryOptions = {
        ...options,
        search: { field: 'name', value: searchTerm.trim() },
      };

      const nameResults = await DatabaseService.query<UserProfile>(
        COLLECTIONS.USERS,
        nameSearchOptions
      );

      // Si la búsqueda por nombre fue exitosa, devolverla
      if (nameResults.success && nameResults.data) {
        return nameResults;
      }

      // Si no hay resultados por nombre, buscar por email
      const emailSearchOptions: QueryOptions = {
        ...options,
        search: { field: 'email', value: searchTerm.trim().toLowerCase() },
      };

      return await DatabaseService.query<UserProfile>(
        COLLECTIONS.USERS,
        emailSearchOptions
      );
    } catch (error) {
      return handleApiError<{ documents: UserProfile[]; total: number }>(error);
    }
  }

  // Contar usuarios con filtros
  static async countUsers(filters?: string[]): Promise<ApiResponse<number>> {
    try {
      return await DatabaseService.count(COLLECTIONS.USERS, filters);
    } catch (error) {
      return handleApiError<number>(error);
    }
  }

  // Contar usuarios por rol
  static async countUsersByRole(
    role: 'user' | 'admin'
  ): Promise<ApiResponse<number>> {
    if (!validateRole(role)) {
      return handleApiError<number>(new Error('Rol inválido'));
    }

    try {
      return await DatabaseService.count(COLLECTIONS.USERS, [`role==${role}`]);
    } catch (error) {
      return handleApiError<number>(error);
    }
  }

  // Actualizar estadísticas de usuario
  static async updateUserStats(
    userId: string,
    stats: Partial<UserStats>
  ): Promise<ApiResponse<UserProfile>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<UserProfile>(new Error('ID de usuario requerido'));
    }

    if (!stats || typeof stats !== 'object') {
      return handleApiError<UserProfile>(new Error('Estadísticas requeridas'));
    }

    try {
      // Obtener el perfil actual para combinar las estadísticas
      const currentProfile = await this.getUserProfile(userId);
      if (!currentProfile.success || !currentProfile.data) {
        return handleApiError<UserProfile>(
          new Error('No se pudo obtener el perfil del usuario')
        );
      }

      const currentStats = currentProfile.data.stats || {
        itemsCreated: 0,
        reservationsMade: 0,
        reviewsGiven: 0,
        rating: 0,
      };

      const updatedStats: UserStats = {
        ...currentStats,
        ...stats,
      };

      return await DatabaseService.update<UserProfile>(
        COLLECTIONS.USERS,
        userId.trim(),
        { stats: updatedStats }
      );
    } catch (error) {
      return handleApiError<UserProfile>(error);
    }
  }

  // Incrementar estadística específica
  static async incrementUserStat(
    userId: string,
    statName: keyof UserStats,
    increment: number = 1
  ): Promise<ApiResponse<UserProfile>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<UserProfile>(new Error('ID de usuario requerido'));
    }

    if (typeof increment !== 'number' || increment < 0) {
      return handleApiError<UserProfile>(
        new Error('Incremento debe ser un número positivo')
      );
    }

    try {
      // Obtener el perfil actual
      const currentProfile = await this.getUserProfile(userId);
      if (!currentProfile.success || !currentProfile.data) {
        return handleApiError<UserProfile>(
          new Error('No se pudo obtener el perfil del usuario')
        );
      }

      const currentStats = currentProfile.data.stats || {
        itemsCreated: 0,
        reservationsMade: 0,
        reviewsGiven: 0,
        rating: 0,
      };

      const updatedStats = {
        ...currentStats,
        [statName]: (currentStats[statName] || 0) + increment,
      };

      return await DatabaseService.update<UserProfile>(
        COLLECTIONS.USERS,
        userId.trim(),
        { stats: updatedStats }
      );
    } catch (error) {
      return handleApiError<UserProfile>(error);
    }
  }

  // Actualizar último login
  static async updateLastLogin(
    userId: string
  ): Promise<ApiResponse<UserProfile>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<UserProfile>(new Error('ID de usuario requerido'));
    }

    try {
      const now = new Date().toISOString();
      return await DatabaseService.update<UserProfile>(
        COLLECTIONS.USERS,
        userId.trim(),
        { lastLoginAt: now }
      );
    } catch (error) {
      return handleApiError<UserProfile>(error);
    }
  }

  // Verificar si el usuario tiene permisos de administrador
  static async isAdmin(userId: string): Promise<ApiResponse<boolean>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<boolean>(new Error('ID de usuario requerido'));
    }

    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile.success || !userProfile.data) {
        return handleApiError<boolean>(new Error('Usuario no encontrado'));
      }

      return handleApiSuccess(userProfile.data.role === 'admin');
    } catch (error) {
      return handleApiError<boolean>(error);
    }
  }

  // Verificar si el usuario está activo
  static async isUserActive(userId: string): Promise<ApiResponse<boolean>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<boolean>(new Error('ID de usuario requerido'));
    }

    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile.success || !userProfile.data) {
        return handleApiError<boolean>(new Error('Usuario no encontrado'));
      }

      return handleApiSuccess(userProfile.data.isActive);
    } catch (error) {
      return handleApiError<boolean>(error);
    }
  }

  // Obtener usuarios recientes
  static async getRecentUsers(
    limit: number = 10
  ): Promise<ApiResponse<{ documents: UserProfile[]; total: number }>> {
    if (typeof limit !== 'number' || limit <= 0 || limit > 100) {
      return handleApiError<{ documents: UserProfile[]; total: number }>(
        new Error('Límite debe ser un número entre 1 y 100')
      );
    }

    try {
      const queryOptions: QueryOptions = {
        limit,
        orderBy: 'joinedAt',
        orderType: 'DESC',
        filters: ['isActive==true'],
      };

      return await DatabaseService.query<UserProfile>(
        COLLECTIONS.USERS,
        queryOptions
      );
    } catch (error) {
      return handleApiError<{ documents: UserProfile[]; total: number }>(error);
    }
  }

  // Obtener usuarios con mejor rating
  static async getTopRatedUsers(
    limit: number = 10
  ): Promise<ApiResponse<{ documents: UserProfile[]; total: number }>> {
    if (typeof limit !== 'number' || limit <= 0 || limit > 100) {
      return handleApiError<{ documents: UserProfile[]; total: number }>(
        new Error('Límite debe ser un número entre 1 y 100')
      );
    }

    try {
      const queryOptions: QueryOptions = {
        limit,
        orderBy: 'stats.rating',
        orderType: 'DESC',
        filters: ['isActive==true'],
      };

      return await DatabaseService.query<UserProfile>(
        COLLECTIONS.USERS,
        queryOptions
      );
    } catch (error) {
      return handleApiError<{ documents: UserProfile[]; total: number }>(error);
    }
  }

  // Sincronizar perfil con Firebase Auth
  static async syncWithFirebaseAuth(
    userId: string,
    firebaseUser: User
  ): Promise<ApiResponse<UserProfile>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<UserProfile>(new Error('ID de usuario requerido'));
    }

    if (!firebaseUser) {
      return handleApiError<UserProfile>(
        new Error('Usuario de Firebase requerido')
      );
    }

    try {
      const updateData: Partial<UserProfile> = {
        email: firebaseUser.email?.toLowerCase() || '',
        emailVerified: firebaseUser.emailVerified,
        avatar: firebaseUser.photoURL || undefined,
      };

      // Si el usuario tiene displayName y no tenemos nombre, actualizarlo
      if (firebaseUser.displayName) {
        const currentProfile = await this.getUserProfile(userId);
        if (
          currentProfile.success &&
          currentProfile.data &&
          !currentProfile.data.name
        ) {
          updateData.name = firebaseUser.displayName;
        }
      }

      return await DatabaseService.update<UserProfile>(
        COLLECTIONS.USERS,
        userId.trim(),
        updateData
      );
    } catch (error) {
      return handleApiError<UserProfile>(error);
    }
  }
}

// Funciones de utilidad para control de acceso basado en roles
export const checkUserPermission = async (
  userId: string,
  requiredRole: 'user' | 'admin' = 'user'
): Promise<ApiResponse<boolean>> => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return handleApiError<boolean>(new Error('ID de usuario requerido'));
  }

  try {
    const userProfile = await UsersService.getUserProfile(userId);
    if (!userProfile.success || !userProfile.data) {
      return handleApiError<boolean>(new Error('Usuario no encontrado'));
    }

    const user = userProfile.data;

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return handleApiError<boolean>(new Error('Usuario inactivo'));
    }

    // Los administradores tienen todos los permisos
    if (user.role === 'admin') {
      return handleApiSuccess(true);
    }

    // Verificar si el usuario tiene el rol requerido
    const hasPermission = user.role === requiredRole;
    return handleApiSuccess(hasPermission);
  } catch (error) {
    return handleApiError<boolean>(error);
  }
};

// Middleware para verificar permisos de administrador
export const requireAdminRole = async (
  userId: string
): Promise<ApiResponse<boolean>> => {
  return await checkUserPermission(userId, 'admin');
};

// Función para obtener estadísticas generales de usuarios
export const getUsersOverview = async (): Promise<
  ApiResponse<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    recentUsers: number;
  }>
> => {
  try {
    const [totalResult, activeResult, adminResult, recentResult] =
      await Promise.all([
        UsersService.countUsers(),
        UsersService.countUsers(['isActive==true']),
        UsersService.countUsersByRole('admin'),
        UsersService.getRecentUsers(30), // Usuarios de los últimos 30 días
      ]);

    if (
      !totalResult.success ||
      !activeResult.success ||
      !adminResult.success ||
      !recentResult.success
    ) {
      return handleApiError(
        new Error('Error al obtener estadísticas de usuarios')
      );
    }

    return handleApiSuccess({
      totalUsers: totalResult.data || 0,
      activeUsers: activeResult.data || 0,
      adminUsers: adminResult.data || 0,
      recentUsers: recentResult.data?.total || 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
};
