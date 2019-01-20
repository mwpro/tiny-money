import Vue from 'vue';
import Router from 'vue-router';

import Dashboard from './home/Dashboard.vue';
import TransactionsIndex from './transactions/TransactionsIndex.vue';
import BudgetsIndex from './budgets/BudgetsIndex.vue';
import TagsIndex from './tags/TagsIndex.vue';
import VendorsIndex from './vendors/VendorsIndex.vue';
import CategoriesIndex from './categories/CategoriesIndex.vue';
import EditCategory from './categories/EditCategory.vue';
import EditSubcategory from './categories/EditSubcategory.vue';

import InitializeBudget from './budgets/InitializeBudget.vue';

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
      component: InitializeBudget,//BudgetsIndex, // TODO revert
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
  ],
});
