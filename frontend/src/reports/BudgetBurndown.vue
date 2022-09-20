<template>
  <v-flex xs6 v-if="shouldBeRendered">
    <v-card>
      <v-container
        fill-height
        fluid
        pa-2
      >
        <v-layout fill-height>
          <v-flex xs12 align-end flexbox>
            <span class="headline">Zużycie budżetu</span>
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
      chartData: {},
      chartOptions: {}
    }),
    computed: {
      ...mapState('reports', {selectedMonths: 'selectedMonths'}),
      shouldBeRendered() {
        return this.selectedMonths.length === 1
      }
    },
    watch: {
      selectedMonths () {
        this.shouldBeRendered && this.loadChart();
      }
    },
    methods: {
      loadChart() {
        let selectedMonths = this.selectedMonths
          .map(m => `${m.year}-${m.month}-01`);
        axios // todo use store here
          .get("/api/reports/budgetBurndown", {
              params: {months: selectedMonths},
              paramsSerializer: function(params) {
                return qs.stringify(params, {arrayFormat: 'repeat'})
              },
            }
          )
          .then((response) => {
            if (response.status !== 200) throw Error(response.message);
            this.chartData = response.data;

            this.chartData.datasets.forEach(ds => {
              ds.borderColor = ds.backgroundColor = response.data.datasets[0].data.at(-1) > 0 ? ColorPalette.positive
                : ColorPalette.negative;
              ds.label = "Budżet";
              ds.fill = true;
            });
            this.loaded = true;
          });
      }
    }
  }
</script>
