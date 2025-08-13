// -----------------------------
// FLUJOS DE LOGIN APPWRITE
//
// 1. Login estándar (email y password):
//    - Usar AuthAPI.login({ email, password })
//    - Internamente llama a account.createSession(email, password)
//    - NO usar /account/sessions/token para este caso
//
// 2. Login avanzado (token: userId + secret):
//    - Usar AuthAPI.loginWithToken({ userId, secret })
//    - Solo si tienes userId y secret de magic link, phone, etc.
//    - Internamente llama a account.createSession(userId, secret)
//    - NO usar email como userId aquí
// -----------------------------

export interface TokenCredentials {
  userId: string;
  secret: string;
}
import {
  account,
  handleApiError,
  handleApiSuccess,
  type ApiResponse,
} from './api';
import { ID, Models, OAuthProvider } from 'appwrite';

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

  // Iniciar sesión estándar
  static async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<Models.Session>> {
    try {
      const session = await account.createEmailPasswordSession(
        credentials.email,
        credentials.password
      );
      return handleApiSuccess(session, 'Sesión iniciada exitosamente');
    } catch (error) {
      return handleApiError(error) as ApiResponse<Models.Session>;
    }
  }

  /**
   * Login avanzado usando userId y secret (token)
   * Usar solo si tienes userId y secret de magic link, phone, etc.
   * No usar para login normal con email y password.
   */
  static async loginWithToken(
    credentials: TokenCredentials
  ): Promise<ApiResponse<Models.Session>> {
    try {
      const session = await account.createSession(
        credentials.userId,
        credentials.secret
      );
      return handleApiSuccess(session, 'Sesión iniciada con token');
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

  // Iniciar OAuth con cualquier proveedor soportado
  static async createOAuth2Session(
    provider: OAuthProvider,
    successUrl?: string,
    failureUrl?: string
  ): Promise<void> {
    // Crear URLs de callback si no se proporcionan
    const success = successUrl || `${window.location.origin}/auth/callback`;
    const failure =
      failureUrl || `${window.location.origin}/login?error=oauth_failed`;

    // Crear sesión OAuth2 - esto redirigirá automáticamente
    account.createOAuth2Session(provider, success, failure);
  }

  // Verificar si hay una sesión OAuth activa después del callback
  static async handleOAuthCallback(): Promise<ApiResponse<User>> {
    try {
      const user = await account.get();
      return handleApiSuccess(user as User, 'Autenticación OAuth exitosa');
    } catch (error) {
      return handleApiError(error) as ApiResponse<User>;
    }
  }
}
