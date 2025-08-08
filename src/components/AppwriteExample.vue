<template>
  <div class="appwrite-example">
    <h2>Library of Things - Appwrite Integration</h2>

    <!-- Loading indicator -->
    <div v-if="loading" class="loading">Cargando...</div>

    <!-- Error display -->
    <div v-if="error" class="error">Error: {{ error }}</div>

    <!-- Current User -->
    <div class="user-section">
      <h3>Usuario Actual</h3>
      <div v-if="state.currentUser">
        Bienvenido, {{ state.currentUser.name }}!
        <button @click="logout">Cerrar Sesión</button>
      </div>
      <div v-else>
        <button @click="showLoginForm = !showLoginForm">
          {{ showLoginForm ? 'Cancelar' : 'Iniciar Sesión' }}
        </button>

        <!-- Login Form -->
        <form
          v-if="showLoginForm"
          @submit.prevent="handleLogin"
          class="login-form"
        >
          <input
            v-model="loginForm.email"
            type="email"
            placeholder="Email"
            required
          />
          <input
            v-model="loginForm.password"
            type="password"
            placeholder="Password"
            required
          />
          <button type="submit" :disabled="loading">Iniciar Sesión</button>
        </form>
      </div>
    </div>

    <!-- Users Section -->
    <div class="users-section">
      <h3>Usuarios ({{ state.users.length }})</h3>
      <button @click="loadUsers" :disabled="loading">Cargar Usuarios</button>

      <div class="users-list">
        <div v-for="user in state.users" :key="user.$id" class="user-card">
          <strong>{{ user.name }}</strong>
          <span>{{ user.email }}</span>
        </div>
      </div>

      <!-- Add User Form -->
      <form @submit.prevent="handleCreateUser" class="add-form">
        <h4>Agregar Usuario</h4>
        <input v-model="newUser.name" placeholder="Nombre" required />
        <input
          v-model="newUser.email"
          type="email"
          placeholder="Email"
          required
        />
        <button type="submit" :disabled="loading">Agregar Usuario</button>
      </form>
    </div>

    <!-- Items Section -->
    <div class="items-section">
      <h3>Items ({{ state.items.length }})</h3>
      <button @click="loadItems" :disabled="loading">Cargar Items</button>

      <div class="items-list">
        <div v-for="item in state.items" :key="item.$id" class="item-card">
          <strong>{{ item.name || item.title }}</strong>
          <span>{{ item.description }}</span>
        </div>
      </div>
    </div>

    <!-- Reservations Section -->
    <div class="reservations-section">
      <h3>Reservaciones ({{ state.reservations.length }})</h3>
      <button @click="loadReservations" :disabled="loading">
        Cargar Reservaciones
      </button>

      <div class="reservations-list">
        <div
          v-for="reservation in state.reservations"
          :key="reservation.$id"
          class="reservation-card"
        >
          <span>Reservación: {{ reservation.$id }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAppwrite } from '@/composables/useAppwrite';

const {
  loading,
  error,
  state,
  loadUsers,
  createUser,
  loadItems,
  loadReservations,
  loadCurrentUser,
  login,
  logout,
} = useAppwrite();

// Form states
const showLoginForm = ref(false);
const loginForm = ref({
  email: '',
  password: '',
});

const newUser = ref({
  name: '',
  email: '',
});

// Handlers
const handleLogin = async () => {
  try {
    await login(loginForm.value.email, loginForm.value.password);
    showLoginForm.value = false;
    loginForm.value = { email: '', password: '' };
  } catch {
    // Error is handled by the composable
  }
};

const handleCreateUser = async () => {
  try {
    await createUser(newUser.value);
    newUser.value = { name: '', email: '' };
  } catch {
    // Error is handled by the composable
  }
};

// Load initial data
onMounted(async () => {
  await loadCurrentUser();
});
</script>

<style scoped>
.appwrite-example {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  background: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.user-section,
.users-section,
.items-section,
.reservations-section {
  margin: 30px 0;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.login-form,
.add-form {
  margin: 15px 0;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.login-form input,
.add-form input {
  display: block;
  width: 100%;
  margin: 10px 0;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.user-card,
.item-card,
.reservation-card {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  margin: 5px 0;
  background: #f5f5f5;
  border-radius: 4px;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
