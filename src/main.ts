import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/router';
import { useAuthStore } from '@/store/auth.store';
import './style.css';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize auth state
const authStore = useAuthStore();
authStore.initializeAuth();

app.mount('#app');