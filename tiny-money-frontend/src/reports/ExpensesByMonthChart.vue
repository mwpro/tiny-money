<script>
  import { Bar } from 'vue-chartjs'
  import axios from 'axios';
  import ColorPalette from './ColorPalette.js';
  import { mapState } from 'vuex';

  export default {
    extends: Bar,
    data: () => ({
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
      ...mapState('categories', { categories: 'categoriesList' }),
    },
    async mounted() {
      this.$store.dispatch('categories/getCategories').then(x => {
        axios // todo use store here
          .get(`${process.env.VUE_APP_API_NEW}/api/reports/expensesByMonth`)
          .then((response) => {
            if (response.status !== 200) throw Error(response.message);
            this.chartData = response.data;
            let i = 0;
            this.chartData.datasets.forEach(ds => {
              ds.backgroundColor= ColorPalette.colors[i++%20];
              ds.label = this.categories.filter(c => c.id == ds.label)[0].name;
            });
            this.renderChart(this.chartData, this.chartOptions);
            console.log(this.categories);
          });
      });
    }
  }
</script>
