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

  const seriesConfig = {
    budget: ds => {
      ds.borderColor = ColorPalette.getColor(0);
      ds.label = "Budżet";
      ds.fill = false;
    },
    incomes: ds => {
      ds.borderColor = ColorPalette.positive;
      ds.label = "Przychody";
      ds.fill = false;
    },
    expenses: ds => {
      ds.borderColor = ColorPalette.negative;
      ds.label = "Wydatki";
      ds.fill = false;
    }
  }

  export default {
    components: {LineChart},
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
          .get("/api/reports/monthsSummary", {
              params: {months: selectedMonths},
              paramsSerializer: function(params) {
                return qs.stringify(params, {arrayFormat: 'repeat'})
              },
            }
          )
          .then((response) => {
            if (response.status !== 200) throw Error(response.message);
            this.chartData = response.data;
            this.chartData.datasets.forEach(ds => seriesConfig[ds.label](ds));
            this.loaded = true;
          });
      }
    }
  }
</script>
