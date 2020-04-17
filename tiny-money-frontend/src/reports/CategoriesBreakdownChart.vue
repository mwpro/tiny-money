<script>
  import {Doughnut} from "vue-chartjs";

  export default {
    extends: Doughnut,
    data: () => ({
      chartData: {
        labels: [ "Jedzenie", "Opłaty", "Abonamenty", "Sprzęty", "Zwierzęta", "Inne"],
        datasets: [{
          label: 'Budżet',
          fill: false,
          data: [2300, 1500, 540, 2000, 450, 432],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(192, 75, 192, 0.5)',
            'rgba(11, 75, 192, 0.5)',
            'rgba(192, 192, 75, 0.5)'
          ],
        }],
      },
      chartOptions: {
      }
    }),
    mounted() {
      this.renderChart(this.chartData, this.chartOptions)
    }
  }
</script>
