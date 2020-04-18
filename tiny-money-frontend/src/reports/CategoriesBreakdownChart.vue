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
            <span class="headline">Kategorie sumarycznie</span>
            <doughnut-chart v-if="loaded"
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
  import DoughnutChart from "./charts/DoughnutChart.vue";
  import {mapState} from "vuex";
  import axios from "axios";
  import ColorPalette from "./ColorPalette";
  const qs = require('qs');

  export default {
    components: {DoughnutChart},
    data: () => ({
      loaded: false,
      chartData: {},
      chartOptions: {}
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
          .get(`${process.env.VUE_APP_API_NEW}/api/reports/categoriesBreakdown`, {
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
              ds.backgroundColor = ds.data.map(d => ColorPalette.getColor(i++));
            });
            this.chartData.labels = this.chartData.labels
              .map(l =>
                this.categories.filter(c => c.id == l)[0].name
              );

            this.loaded = true;
          });
      }
    }
  }
</script>
