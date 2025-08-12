import { apiResource, COLLECTIONS, Query, type ApiResponse } from './api';
import type { UserModel } from '@/types/models';

// Endpoint para usuarios
const endpoint = COLLECTIONS.USERS;

// Exportar métodos estándar usando destructuring
export const { index, show, save, update, remove, search, count } =
  apiResource<UserModel>(endpoint);

// Métodos adicionales específicos para usuarios
export const usersAPI = {
  // Buscar usuarios por email
  async findByEmail(
    email: string
  ): Promise<ApiResponse<{ documents: UserModel[]; total: number }>> {
    return search('email', email);
  },

  // Buscar usuarios por nombre
  async findByName(
    name: string
  ): Promise<ApiResponse<{ documents: UserModel[]; total: number }>> {
    return search('name', name);
  },

  // Obtener usuarios verificados
  async getVerifiedUsers(): Promise<
    ApiResponse<{ documents: UserModel[]; total: number }>
  > {
    return index({
      filters: [Query.equal('emailVerified', true)],
    });
  },

  // Obtener usuarios por nivel de confianza
  async getUsersByTrustLevel(
    trustLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  ): Promise<ApiResponse<{ documents: UserModel[]; total: number }>> {
    return index({
      filters: [Query.equal('trustLevel', trustLevel)],
    });
  },

  // Obtener usuarios con mejor rating
  async getTopRatedUsers(
    limit = 10
  ): Promise<ApiResponse<{ documents: UserModel[]; total: number }>> {
    return index({
      limit,
      orderBy: 'averageRating',
      orderType: 'DESC',
      filters: [Query.greaterThan('totalReviews', 0)],
    });
  },

  // Actualizar avatar del usuario
  async updateAvatar(
    userId: string,
    avatarUrl: string
  ): Promise<ApiResponse<UserModel>> {
    return update(userId, { avatarUrl });
  },

  // Actualizar estadísticas de confianza
  async updateTrustMetrics(
    userId: string,
    metrics: {
      averageRating?: number;
      totalReviews?: number;
      successfulLoans?: number;
      totalLoans?: number;
      trustLevel?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    }
  ): Promise<ApiResponse<UserModel>> {
    return update(userId, metrics);
  },
};

// Exportar también los métodos adicionales individualmente para mayor flexibilidad
export const {
  findByEmail,
  findByName,
  getVerifiedUsers,
  getUsersByTrustLevel,
  getTopRatedUsers,
  updateAvatar,
  updateTrustMetrics,
} = usersAPI;
