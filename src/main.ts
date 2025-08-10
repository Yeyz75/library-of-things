import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/router';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import i18n from '@/lib/i18n';
import './style.css';
import App from './App.vue';
import clickOutside from './directives/clickOutside';
import PrimeVue from 'primevue/config';
import { MotionPlugin } from '@vueuse/motion';
import '@/primevue-style';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);
app.use(PrimeVue, { unstyled: true });
app.use(MotionPlugin);

// Registrar directiva global
app.directive('click-outside', clickOutside);

// Initialize stores
const authStore = useAuthStore();
const themeStore = useThemeStore();

authStore.initializeAuth();
themeStore.initTheme();

app.mount('#app');
