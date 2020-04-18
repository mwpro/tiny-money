<template>
  <v-container
    fluid
    grid-list-md
  >
    <h1>Raporty</h1>

    <v-layout row wrap>
      <v-flex
        v-bind="{ [`xs12`]: true }"
      >
        <v-card>
          <v-container
            fill-height
            fluid
            pa-2
          >
            <v-layout fill-height>
              <v-flex xs12 align-end flexbox>
                <span class="headline">Konfiguracja: rok (wszystkie)/miesiąc (wszystkie)</span>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
      <expenses-by-month-chart />
      <v-flex xs6>
        <v-card>
          <v-container
            fill-height
            fluid
            pa-2
          >
            <v-layout fill-height>
              <v-flex xs12 align-end flexbox>
                <span class="headline">Budżet vs wydatki</span>
                <months-summary-chart />
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
  import ExpensesByMonthChart from './ExpensesByMonthChart.vue';
  import MonthsSummaryChart from "./MonthsSummaryChart.vue";
  import CategoriesBreakdownChart from "./CategoriesBreakdownChart.vue";
  import TopSellersTable from "./TopSellersTable.vue";
  import TopTransactionsTable from "./TopTransactionsTable.vue";
  import TopTagsTable from "./TopTagsTable.vue";

  export default {
    name: "",
    components: { ExpensesByMonthChart, MonthsSummaryChart, CategoriesBreakdownChart, TopSellersTable, TopTransactionsTable, TopTagsTable },
    data: () => ({
    }),
  }
</script>
