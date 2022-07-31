import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'Home',
        path: '',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        name: 'Account',
        path: 'account',
        component: () => import('pages/AccountPage.vue'),
      },
      {
        name: 'Admin',
        path: 'admin',
        component: () => import('pages/AdminPage.vue'),
      },
      {
        name: 'Game',
        path: 'game',
        component: () => import('pages/GamePage.vue'),
      },
      {
        name: 'Enter',
        path: 'enter',
        component: () => import('pages/EnterPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
