import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth.store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/pages/HomePage.vue'),
      meta: { layout: 'app' },
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { layout: 'auth', requiresGuest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/pages/auth/RegisterPage.vue'),
      meta: { layout: 'auth', requiresGuest: true },
    },
    {
      path: '/auth/callback',
      name: 'AuthCallback',
      component: () => import('@/pages/auth/AuthCallback.vue'),
      meta: { layout: 'auth' },
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/pages/DashboardPage.vue'),
      meta: { layout: 'app', requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/pages/ProfilePage.vue'),
      meta: { layout: 'app', requiresAuth: true },
    },
    {
      path: '/items',
      children: [
        {
          path: 'new',
          name: 'CreateItem',
          component: () => import('@/pages/items/CreateItemPage.vue'),
          meta: { layout: 'app', requiresAuth: true },
        },
        {
          path: ':id',
          name: 'ItemDetail',
          component: () => import('@/pages/items/ItemDetailPage.vue'),
          meta: { layout: 'app' },
        },
        {
          path: ':id/edit',
          name: 'EditItem',
          component: () => import('@/pages/items/EditItemPage.vue'),
          meta: { layout: 'app', requiresAuth: true },
        },
        {
          path: ':id/review',
          name: 'CreateReview',
          component: () => import('@/pages/items/CreateReviewPage.vue'),
          meta: { layout: 'app', requiresAuth: true },
        },
      ],
    },
    {
      path: '/reservations',
      name: 'Reservations',
      component: () => import('@/pages/ReservationsPage.vue'),
      meta: { layout: 'app', requiresAuth: true },
    },
    {
      path: '/search',
      name: 'Search',
      component: () => import('@/pages/ExplorePage.vue'),
      meta: { layout: 'app' },
    },
    {
      path: '/explore',
      name: 'Explore',
      component: () => import('@/pages/ExplorePage.vue'),
      meta: { layout: 'app' },
    },
    {
      path: '/donations',
      name: 'Donations',
      component: () => import('@/pages/DonationsPage.vue'),
      meta: { layout: 'app' },
    },
    {
      path: '/help',
      name: 'Help',
      component: () => import('@/pages/HelpPage.vue'),
      meta: { layout: 'app' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/pages/NotFoundPage.vue'),
      meta: { layout: 'app' },
    },
  ],
});

// Navigation guards
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }

  // Check if route requires guest (not authenticated)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Dashboard' });
    return;
  }

  next();
});

export default router;
