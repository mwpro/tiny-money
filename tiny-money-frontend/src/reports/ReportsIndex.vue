<template>
  <v-container
    fluid
    grid-list-md
  >
    <v-layout row wrap>
      <reports-filter />
      <expenses-by-month-chart />
      <months-summary-chart />
      <categories-breakdown-chart />
      <top-vendors-table />
      <top-tags-table />
      <top-transactions-table />
    </v-layout>
  </v-container>
</template>

<script>
  import ReportsFilter from './ReportsFilter.vue';
  import ExpensesByMonthChart from './ExpensesByMonthChart.vue';
  import MonthsSummaryChart from "./MonthsSummaryChart.vue";
  import CategoriesBreakdownChart from "./CategoriesBreakdownChart.vue";
  import TopVendorsTable from "./TopVendorsTable.vue";
  import TopTransactionsTable from "./TopTransactionsTable.vue";
  import TopTagsTable from "./TopTagsTable.vue";

  export default {
    name: "",
    components: { ReportsFilter, ExpensesByMonthChart, MonthsSummaryChart, CategoriesBreakdownChart,
      TopVendorsTable, TopTransactionsTable, TopTagsTable },
    data: () => ({
    }),
    created() {
      this.$store.dispatch('categories/getCategories');
      this.$store.dispatch('vendors/getVendorsAction');
      this.$store.dispatch('tags/getTagsAction');
    }
  }
</script>
