import Vue from 'vue';
import Router from 'vue-router';

import Dashboard from './home/Dashboard.vue';
import TransactionsIndex from './transactions/TransactionsIndex.vue';
import BudgetsIndex from './budgets/BudgetsIndex.vue';
import TagsIndex from './tags/TagsIndex.vue';
import VendorsIndex from './vendors/VendorsIndex.vue';
import CategoriesIndex from './categories/CategoriesIndex.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionsIndex,
    },
    {
      path: '/budgets',
      name: 'budgets',
      component: BudgetsIndex,
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
  ],
});
