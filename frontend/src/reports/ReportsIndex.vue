<template>
  <v-container
    fluid
    grid-list-md
  >
    <v-layout row wrap>
      <reports-filter />
      <totals />
      <expenses-by-month-chart />
      <budget-burndown />
      <months-summary-chart />
      <categories-breakdown-chart />
      <income-breakdown-chart />
      <top-vendors-table />
      <top-tags-table />
      <top-expenses-table />
    </v-layout>
  </v-container>
</template>

<script>
  import ReportsFilter from './ReportsFilter.vue';
  import ExpensesByMonthChart from './ExpensesByMonthChart.vue';
  import MonthsSummaryChart from "./MonthsSummaryChart.vue";
  import CategoriesBreakdownChart from "./CategoriesBreakdownChart.vue";
  import TopVendorsTable from "./TopVendorsTable.vue";
  import TopExpensesTable from "@/reports/TopExpensesTable";
  import TopTagsTable from "./TopTagsTable.vue";
  import BudgetBurndown from "@/reports/BudgetBurndown";
  import IncomeBreakdownChart from "@/reports/IncomeBreakdownChart.vue";
  import Totals from "@/reports/Totals.vue";

  export default {
    name: "",
    components: {
      Totals, IncomeBreakdownChart,
      BudgetBurndown, ReportsFilter, ExpensesByMonthChart, MonthsSummaryChart, CategoriesBreakdownChart,
      TopVendorsTable, TopExpensesTable, TopTagsTable },
    data: () => ({
    }),
    created() {
      this.$store.dispatch('categories/getCategories');
      this.$store.dispatch('vendors/getVendorsAction');
      this.$store.dispatch('tags/getTagsAction');
    }
  }
</script>
