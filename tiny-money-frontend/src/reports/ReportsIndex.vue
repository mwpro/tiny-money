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
                <span class="headline">wykres liniowy: y1: wydatki, y2: budżet, x: miesiące. Konfiguracja: tylko dla miesiąc - wszystkie</span>
                <canvas id="myChart" width="400" height="400"></canvas>
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
          title: 'wykres słupkowy: y: wydatki (z rozdziałem na kategorie), x: miesiące. tylko dla miesiąc - wsztstkie',
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
      labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
      datasets: [{
        label: '# of Votes',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }]
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
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      });
    }
  }
</script>

<style scoped>

</style>
