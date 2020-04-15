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
                <span class="headline">wykres słupkowy: y: wydatki (z rozdziałem na kategorie), x: miesiące. tylko dla miesiąc - wsztstkie</span>
                <canvas id="myChart" width="400" height="200"></canvas>
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
  import Chart from 'chart.js';

  export default {
    name: "",
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
          title: 'wykres liniowy: y1: wydatki, y2: budżet, x: miesiące. Konfiguracja: tylko dla miesiąc - wszystkie',
          flex: 12
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
      ],
      labels: [new Date(2020, 0, 1), new Date(2020, 1, 1), new Date(2020, 2, 1), new Date(2020, 3, 1), new Date(2020, 4, 1), new Date(2020, 5, 1)],
      datasets: [{
        label: 'Kategoria 1',
        data: [3000, 5000, 1000, 3032, 1349, 4242],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
        {
          label: 'Kategoria 2',
          data: [400, 21, 505, 420, 0, 15],
          backgroundColor: 'rgba(255, 206, 86, 0.5)',
        },
        {
          label: 'Kategoria 3',
          data: [0, 3, 0, 0, 4000, 0],
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        }]
      // 'rgba(153, 102, 255, 0.2)',
      // 'rgba(255, 159, 64, 0.2)'
    }),
    mounted() {
      var ctx = document.getElementById('myChart');
      var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.labels,
          datasets: this.datasets
        },
        options: {
          scales: {
            xAxes: [{
              type: 'time',
              time: {
                unit: 'month'
              },
              stacked: true,
            }],
            yAxes: [{
              ticks: {
                beginAtZero: true
              },
              stacked: true,
            }]
          }
        }
      });
    }
  }
</script>

<style scoped>

</style>
