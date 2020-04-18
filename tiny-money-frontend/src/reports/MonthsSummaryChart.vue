<script>
  import {Line} from "vue-chartjs";

  export default {
    extends: Line,
    data: () => ({
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
    mounted() {
      this.renderChart(this.chartData, this.chartOptions)
    }
    }
</script>
