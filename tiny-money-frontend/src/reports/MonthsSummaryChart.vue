<template>
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
            <line-chart v-if="loaded"
                       :chartdata="chartData"
                       :options="chartOptions"/>
            <v-progress-linear v-if="!loaded" :indeterminate="true"></v-progress-linear>

          </v-flex>
        </v-layout>
      </v-container>
    </v-card>
  </v-flex>
</template>

<script>
  import LineChart from "./charts/LineChart.vue";
  import {mapState} from "vuex";
  import axios from "axios";
  import ColorPalette from "./ColorPalette";
  const qs = require('qs');

  export default {
    components: {LineChart},
    data: () => ({
      loaded: false,
      chartData: {
        labels: [new Date(2020, 0, 1), new Date(2020, 1, 1), new Date(2020, 2, 1), new Date(2020, 3, 1), new Date(2020, 4, 1), new Date(2020, 5, 1)],
        datasets: [{
          label: 'Budżet',
          fill: false,
          data: [3000, 5000, 4300, 8000, 4150, 4302],
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 0.5)',
        },
          {
            label: 'Wydatki',
            fill: false,
            data: [3500, 4500, 4000, 5443, 6000, 7050],
            backgroundColor: 'rgba(255, 206, 86, 0.5)',
            borderColor: 'rgba(255, 206, 86, 0.5)',
          }],
      },
      chartOptions: {
        scales: {
          xAxes: [{
            type: 'time',
            time: {
              unit: 'month'
            },
            //stacked: true,
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true
            },
            //stacked: true,
          }]
        }
      }
    }),
    computed: {
      ...mapState('reports', {selectedMonths: 'selectedMonths'}),
    },
    watch: {
      selectedMonths () {
        this.loadChart();
      }
    },
    methods: {
      loadChart() {
        let selectedMonths = this.selectedMonths
          .map(m => `${m.year}-${m.month}-01`);
        axios // todo use store here
          .get(`${process.env.VUE_APP_API_NEW}/api/reports/monthsSummary`, {
              params: {months: selectedMonths},
              paramsSerializer: function(params) {
                return qs.stringify(params, {arrayFormat: 'repeat'})
              },
            }
          )
          .then((response) => {
            if (response.status !== 200) throw Error(response.message);
            this.chartData = response.data;
            let i = 0;
            this.chartData.datasets.forEach(ds => {
              ds.borderColor = ds.backgroundColor = ds.label === 'budget' ? ColorPalette.positive
                : ColorPalette.negative;
              ds.label = ds.label === 'budget' ? "Budżet"
                : (ds.label === 'expenses' ? "Wydatki" : ds.label);
              ds.fill = false;
            });
            this.loaded = true;
          });
      }
    },
  }
</script>
