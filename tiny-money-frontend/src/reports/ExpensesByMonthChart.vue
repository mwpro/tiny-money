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
            <span class="headline">Wydatki per kategoria</span>
            <bar-chart v-if="loaded"
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
  import BarChart from './charts/BarChart.vue'
  import axios from 'axios';
  import ColorPalette from './ColorPalette.js';
  import {mapState} from 'vuex';

  const qs = require('qs');

  export default {
    components: {BarChart},
    data: () => ({
      loaded: false,
      chartData: {},
      chartOptions: {
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
    }),
    computed: {
      ...mapState('categories', {categories: 'categoriesList'}),
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
          .get(`${process.env.VUE_APP_API_NEW}/api/reports/expensesByMonth`, {
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
              ds.backgroundColor = ColorPalette.getColor(i++);
              ds.label = this.categories.filter(c => c.id == ds.label)[0].name;
            });
            this.loaded = true;
          });
      }
    }
  }
</script>
