import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile as firebaseUpdateProfile,
  sendEmailVerification,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
  UserCredential,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './api';
import { handleApiError, handleApiSuccess, COLLECTIONS } from './api';
import type { ApiResponse } from './api';

// Tipos para autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  confirmPassword?: string;
}

export interface UserProfile {
  $id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  role?: 'user' | 'admin';
  preferences?: Record<string, unknown>;
}

export interface UpdateProfileData {
  name?: string;
  avatar?: string;
  preferences?: Record<string, unknown>;
}

// Clase para manejo de autenticación
export class AuthService {
  /**
   * Iniciar sesión con email y contraseña
   */
  static async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<UserProfile>> {
    try {
      const { email, password } = credentials;

      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }

      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userProfile = await this.getUserProfile(userCredential.user.uid);

      if (!userProfile.success || !userProfile.data) {
        // Si no existe el perfil en Firestore, crearlo
        const newProfile = await this.createUserProfile(userCredential.user);
        return newProfile;
      }

      return handleApiSuccess(userProfile.data, 'Sesión iniciada exitosamente');
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Registrar nuevo usuario
   */
  static async register(
    userData: RegisterData
  ): Promise<ApiResponse<UserProfile>> {
    try {
      const { email, password, name, confirmPassword } = userData;

      // Validaciones
      if (!email || !password || !name) {
        throw new Error('Todos los campos son requeridos');
      }

      if (confirmPassword && password !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Crear usuario en Firebase Auth
      const userCredential: UserCredential =
        await createUserWithEmailAndPassword(auth, email, password);

      // Actualizar el perfil en Firebase Auth
      await firebaseUpdateProfile(userCredential.user, {
        displayName: name,
      });

      // Enviar email de verificación
      await sendEmailVerification(userCredential.user);

      // Crear perfil en Firestore
      const userProfile = await this.createUserProfile(userCredential.user, {
        name,
      });

      return handleApiSuccess(
        userProfile.data!,
        'Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.'
      );
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Cerrar sesión
   */
  static async logout(): Promise<ApiResponse<void>> {
    try {
      await signOut(auth);
      return handleApiSuccess(undefined, 'Sesión cerrada exitosamente');
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Obtener usuario actual
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Obtener perfil del usuario desde Firestore
   */
  static async getUserProfile(
    userId: string
  ): Promise<ApiResponse<UserProfile>> {
    try {
      const userDoc = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userDoc);

      if (!userSnap.exists()) {
        throw new Error('Perfil de usuario no encontrado');
      }

      const userData = userSnap.data();
      const userProfile: UserProfile = {
        $id: userSnap.id,
        email: userData.email,
        name: userData.name,
        emailVerified: userData.emailVerified || false,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        avatar: userData.avatar,
        role: userData.role || 'user',
        preferences: userData.preferences || {},
      };

      return handleApiSuccess(userProfile);
    } catch (error) {
      return handleApiError<UserProfile>(error);
    }
  }

  /**
   * Crear perfil de usuario en Firestore
   */
  static async createUserProfile(
    user: User,
    additionalData: Partial<UserProfile> = {}
  ): Promise<ApiResponse<UserProfile>> {
    try {
      const now = new Date().toISOString();
      const userProfile: Omit<UserProfile, '$id'> = {
        email: user.email!,
        name: additionalData.name || user.displayName || '',
        emailVerified: user.emailVerified,
        createdAt: now,
        updatedAt: now,
        role: 'user',
        preferences: {},
        ...additionalData,
      };

      const userDoc = doc(db, COLLECTIONS.USERS, user.uid);
      await setDoc(userDoc, userProfile);

      return handleApiSuccess(
        { $id: user.uid, ...userProfile },
        'Perfil de usuario creado exitosamente'
      );
    } catch (error) {
      return handleApiError<UserProfile>(error);
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  static async updateProfile(
    userId: string,
    updateData: UpdateProfileData
  ): Promise<ApiResponse<UserProfile>> {
    try {
      const userDoc = doc(db, COLLECTIONS.USERS, userId);
      const updatePayload = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userDoc, updatePayload);

      // Si se actualiza el nombre, también actualizar en Firebase Auth
      if (updateData.name && auth.currentUser) {
        await firebaseUpdateProfile(auth.currentUser, {
          displayName: updateData.name,
        });
      }

      // Obtener el perfil actualizado
      const updatedProfile = await this.getUserProfile(userId);

      return handleApiSuccess(
        updatedProfile.data!,
        'Perfil actualizado exitosamente'
      );
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(newPassword: string): Promise<ApiResponse<void>> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      if (newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      await updatePassword(user, newPassword);

      return handleApiSuccess(undefined, 'Contraseña actualizada exitosamente');
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  static async resetPassword(email: string): Promise<ApiResponse<void>> {
    try {
      if (!email) {
        throw new Error('Email es requerido');
      }

      await sendPasswordResetEmail(auth, email);

      return handleApiSuccess(
        undefined,
        'Email de recuperación enviado exitosamente'
      );
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Reenviar email de verificación
   */
  static async resendVerificationEmail(): Promise<ApiResponse<void>> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      if (user.emailVerified) {
        throw new Error('El email ya está verificado');
      }

      await sendEmailVerification(user);

      return handleApiSuccess(
        undefined,
        'Email de verificación enviado exitosamente'
      );
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  static isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Verificar si el email del usuario está verificado
   */
  static isEmailVerified(): boolean {
    return auth.currentUser?.emailVerified || false;
  }

  /**
   * Manejo específico de errores de autenticación
   */
  private static handleAuthError<T = unknown>(error: unknown): ApiResponse<T> {
    console.error('Auth Error:', error);

    let errorMessage = 'Error de autenticación desconocido';

    if (error && typeof error === 'object' && 'code' in error) {
      const authError = error as AuthError;

      switch (authError.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuario no encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'El email ya está registrado';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es muy débil';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Usuario deshabilitado';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta más tarde';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu internet';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Operación sensible. Inicia sesión nuevamente';
          break;
        default:
          errorMessage = authError.message || errorMessage;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };
  }
}

// Exportar métodos estáticos como funciones individuales para mayor flexibilidad
export const {
  login,
  register,
  logout,
  getCurrentUser,
  getUserProfile,
  changePassword,
  resetPassword,
  resendVerificationEmail,
  isAuthenticated,
  isEmailVerified,
} = AuthService;

// Exportar updateProfile con un nombre diferente para evitar conflictos
export const updateUserProfile = AuthService.updateProfile;

// Hook para observar cambios en el estado de autenticación
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};
