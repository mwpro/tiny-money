import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TransactionsIndex from "../transactions/TransactionsIndex.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/transactions',
      name: 'transactionsIndex',
      redirect: {
        name: 'transactions',
        params: {
          year: new Date().getFullYear(),
          month: (new Date().getMonth() + 1).toString().padStart(2, "0")
        }
      }
    },
    {
      path: '/transactions/:year/:month',
      name: 'transactions',
      component: TransactionsIndex,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
