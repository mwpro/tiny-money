<script>
  import { Bar } from 'vue-chartjs'

  export default {
    extends: Bar,
    data: () => ({
      chartData: {
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
          }],
      },
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
    mounted() {
      this.renderChart(this.chartData, this.chartOptions)
    }
  }
</script>
