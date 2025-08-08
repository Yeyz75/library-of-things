// Configuración de Appwrite para Library of Things
import { Client, Databases, Account, Storage } from 'appwrite';

// Configuración del cliente
const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Servicios de Appwrite
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// IDs de la base de datos y colecciones
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const COLLECTIONS = {
  USERS: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
  ITEMS: import.meta.env.VITE_APPWRITE_ITEMS_COLLECTION_ID,
  RESERVATIONS: import.meta.env.VITE_APPWRITE_RESERVATIONS_COLLECTION_ID,
};

// Funciones helper para operaciones comunes
export const appwriteService = {
  // Usuarios
  async getUsers() {
    return await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS);
  },

  async createUser(userData) {
    return await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      'unique()',
      userData
    );
  },

  async getUserById(userId) {
    return await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
  },

  async updateUser(userId, userData) {
    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      userId,
      userData
    );
  },

  // Items
  async getItems() {
    return await databases.listDocuments(DATABASE_ID, COLLECTIONS.ITEMS);
  },

  async createItem(itemData) {
    return await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.ITEMS,
      'unique()',
      itemData
    );
  },

  async getItemById(itemId) {
    return await databases.getDocument(DATABASE_ID, COLLECTIONS.ITEMS, itemId);
  },

  async updateItem(itemId, itemData) {
    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.ITEMS,
      itemId,
      itemData
    );
  },

  // Reservations
  async getReservations() {
    return await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESERVATIONS);
  },

  async createReservation(reservationData) {
    return await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.RESERVATIONS,
      'unique()',
      reservationData
    );
  },

  async getReservationById(reservationId) {
    return await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.RESERVATIONS,
      reservationId
    );
  },

  async updateReservation(reservationId, reservationData) {
    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.RESERVATIONS,
      reservationId,
      reservationData
    );
  },

  // Autenticación
  async getCurrentUser() {
    try {
      return await account.get();
    } catch {
      return null;
    }
  },

  async login(email, password) {
    return await account.createEmailPasswordSession(email, password);
  },

  async register(email, password, name) {
    return await account.create('unique()', email, password, name);
  },

  async logout() {
    return await account.deleteSession('current');
  },
};

export default client;
