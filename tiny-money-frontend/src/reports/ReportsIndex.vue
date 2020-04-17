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
      <v-flex xs12>
        <v-card>
          <v-container
            fill-height
            fluid
            pa-2
          >
            <v-layout fill-height>
              <v-flex xs12 align-end flexbox>
                <span class="headline">wykres słupkowy: y: wydatki (z rozdziałem na kategorie), x: miesiące. tylko dla miesiąc - wsztstkie</span>
                <expenses-by-month-chart />
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
      <v-flex xs12>
        <v-card>
          <v-container
            fill-height
            fluid
            pa-2
          >
            <v-layout fill-height>
              <v-flex xs12 align-end flexbox>
                <span class="headline">wykres liniowy: y1: wydatki, y2: budżet, x: miesiące. Konfiguracja: tylko dla miesiąc - wszystkie</span>
                <months-summary-chart />
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
      <v-flex
        v-for="card in reportsMocks"
        :key="card.title"
        v-bind="{ [`xs${card.flex}`]: true }"
      >
        <v-card>
          <v-container
            fill-height
            fluid
            pa-2
          >
            <v-layout fill-height>
              <v-flex xs12 align-end flexbox>
                <span class="headline" v-text="card.title"></span>
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

  export default {
    name: "",
    components: { ExpensesByMonthChart, MonthsSummaryChart },
    data: () => ({
      reportsMocks: [
        {
          title: 'gauge: wydatki total',
          flex: 4
        },
        {
          title: 'gauge: budżet total',
          flex: 4
        },
        {
          title: 'gauge: realizacja budżetu +/- i %',
          flex: 4
        },
        {
          title: 'wykres kołowy: wydatki - zewnętrzne koło kategorie, wewnątrz podział na subkategorie.',
          flex: 6
        },
        {
          title: 'tabela: top sprzedawcy',
          flex: 6
        },
        {
          title: 'tabela: top tagi',
          flex: 6
        },
        {
          title: 'tabela: top transakcje',
          flex: 6
        },
      ]
    }),
  }
</script>

<style scoped>

</style>
