import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';

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
      name: 'home',
      component: Home,
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
    // sorry what?
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (about.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import(/* webpackChunkName: "about" */ './views/About.vue'),
    // },
  ],
});
