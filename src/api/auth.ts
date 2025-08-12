import {
  account,
  handleApiError,
  handleApiSuccess,
  type ApiResponse,
} from './api';
import { ID, Models } from 'appwrite';

export interface User {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  phone: string;
  phoneVerification: boolean;
  prefs: Models.Preferences;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export class AuthAPI {
  // Registrar usuario
  static async register(
    credentials: RegisterCredentials
  ): Promise<ApiResponse<User>> {
    try {
      const user = await account.create(
        ID.unique(),
        credentials.email,
        credentials.password,
        credentials.name
      );
      return handleApiSuccess(user, 'Usuario registrado exitosamente');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        message: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  // Iniciar sesión
  static async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<Models.Session>> {
    try {
      const session = await account.createSession(
        credentials.email,
        credentials.password
      );
      return handleApiSuccess(session, 'Sesión iniciada exitosamente');
    } catch (error) {
      return handleApiError(error) as ApiResponse<Models.Session>;
    }
  }

  // Cerrar sesión
  static async logout(): Promise<ApiResponse<null>> {
    try {
      await account.deleteSession('current');
      return handleApiSuccess(null, 'Sesión cerrada exitosamente');
    } catch (error) {
      return handleApiError(error) as ApiResponse<null>;
    }
  }

  // Obtener usuario actual
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const user = await account.get();
      return handleApiSuccess(user as User);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        message: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  // Verificar si hay sesión activa
  static async checkSession(): Promise<ApiResponse<boolean>> {
    try {
      await account.get();
      return handleApiSuccess(true);
    } catch {
      return handleApiSuccess(false);
    }
  }

  // Actualizar perfil
  static async updateProfile(name: string): Promise<ApiResponse<User>> {
    try {
      const user = await account.updateName(name);
      return handleApiSuccess(user as User, 'Perfil actualizado exitosamente');
    } catch (error) {
      return handleApiError(error) as ApiResponse<User>;
    }
  }

  // Cambiar contraseña
  static async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<ApiResponse<null>> {
    try {
      await account.updatePassword(newPassword, oldPassword);
      return handleApiSuccess(null, 'Contraseña actualizada exitosamente');
    } catch (error) {
      return handleApiError(error) as ApiResponse<null>;
    }
  }

  // Recuperar contraseña
  static async forgotPassword(email: string): Promise<ApiResponse<null>> {
    try {
      await account.createRecovery(
        email,
        `${window.location.origin}/reset-password`
      );
      return handleApiSuccess(null, 'Email de recuperación enviado');
    } catch (error) {
      return handleApiError(error) as ApiResponse<null>;
    }
  }

  // Confirmar recuperación de contraseña
  static async resetPassword(
    userId: string,
    secret: string,
    password: string
  ): Promise<ApiResponse<null>> {
    try {
      await account.updateRecovery(userId, secret, password);
      return handleApiSuccess(null, 'Contraseña restablecida exitosamente');
    } catch (error) {
      return handleApiError(error) as ApiResponse<null>;
    }
  }
}
