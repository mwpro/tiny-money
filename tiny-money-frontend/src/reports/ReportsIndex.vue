<template>
  <v-container
    fluid
    grid-list-md
  >
    <v-layout row wrap>
      <reports-filter />
      <expenses-by-month-chart />
      <months-summary-chart />
      <v-flex xs6>
        <v-card>
          <v-container
            fill-height
            fluid
            pa-2
          >
            <v-layout fill-height>
              <v-flex xs12 align-end flexbox>
                <span class="headline">Kategorie sumarycznie</span>
                <categories-breakdown-chart />
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
      <v-flex xs6>
        <v-card>
          <v-container
            fill-height
            fluid
            pa-2
          >
            <v-layout fill-height>
              <v-flex xs12 align-end flexbox>
                <span class="headline">TOP 50 sprzedawców</span>
                <top-sellers-table />
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
      <v-flex xs6>
        <v-card>
          <v-container
            fill-height
            fluid
            pa-2
          >
            <v-layout fill-height>
              <v-flex xs12 align-end flexbox>
                <span class="headline">TOP 50 tagów</span>
                <top-tags-table />
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
      <v-flex xs6>
        <v-card>
          <v-container
            fill-height
            fluid
            pa-2
          >
            <v-layout fill-height>
              <v-flex xs12 align-end flexbox>
                <span class="headline">TOP 50 transakcji</span>
                <top-transactions-table />
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  import ReportsFilter from './ReportsFilter.vue';
  import ExpensesByMonthChart from './ExpensesByMonthChart.vue';
  import MonthsSummaryChart from "./MonthsSummaryChart.vue";
  import CategoriesBreakdownChart from "./CategoriesBreakdownChart.vue";
  import TopSellersTable from "./TopSellersTable.vue";
  import TopTransactionsTable from "./TopTransactionsTable.vue";
  import TopTagsTable from "./TopTagsTable.vue";

  export default {
    name: "",
    components: { ReportsFilter, ExpensesByMonthChart, MonthsSummaryChart, CategoriesBreakdownChart, TopSellersTable, TopTransactionsTable, TopTagsTable },
    data: () => ({
    })
  }
</script>
