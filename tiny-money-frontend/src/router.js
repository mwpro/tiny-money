import Vue from 'vue';
import Router from 'vue-router';

import BufferIndex from './buffer/BufferIndex.vue';
import TransactionsIndex from './transactions/TransactionsIndex.vue';
import BudgetsIndex from './budgets/BudgetsIndex.vue';
import TagsIndex from './tags/TagsIndex.vue';
import VendorsIndex from './vendors/VendorsIndex.vue';
import CategoriesIndex from './categories/CategoriesIndex.vue';
import EditCategory from './categories/EditCategory.vue';
import EditSubcategory from './categories/EditSubcategory.vue';
import Callback from './auth/Callback.vue';
import Login from './auth/Login.vue';
import ReportsIndex from './reports/ReportsIndex.vue'

import InitializeBudget from './budgets/InitializeBudget.vue';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      // name: 'dashboard',
      // component: Dashboard,
      redirect: {
        name: 'transactionsIndex'
      }
    },
    ,
    {
      path: '/buffer',
      name: 'buffer',
      component: BufferIndex,
    },,
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
      path: '/budgets',
      name: 'budgets',
      component: BudgetsIndex,
    },
    {
      path: '/budgets/init',
      name: 'initializeBudget',
      component: InitializeBudget, // TODO temporary
    },
    {
      path: '/tags',
      name: 'tags',
      component: TagsIndex,
    },
    {
      path: '/vendors',
      name: 'vendors',
      component: VendorsIndex,
    },
    {
      path: '/categories',
      name: 'categories',
      component: CategoriesIndex,
    },
    {
      path: '/categories/add',
      name: 'addCategory',
      component: EditCategory,
    },
    {
      path: '/categories/:categoryId/edit',
      name: 'editCategory',
      props: true,
      component: EditCategory,
    },
    {
      path: '/categories/:categoryId/subcategories/add',
      name: 'addSubcategory',
      props: true,
      component: EditSubcategory,
    },
    {
      path: '/categories/:categoryId/subcategories/:subcategoryId',
      name: 'editSubcategory',
      props: true,
      component: EditSubcategory,
    },
    {
      path: '/callback',
      name: 'callback',
      component: Callback,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsIndex,
    },
  ],
});

router.beforeEach((to, from, next) => {
  if (to.name === 'callback' || to.name === 'login' || router.app.$auth.isAuthenticated()) {
    next();
  } else {
    next('/login');
    //
  }
});

export default router;
