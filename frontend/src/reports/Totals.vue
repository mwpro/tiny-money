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
            <span class="headline">Podsumowanie</span>
            <h3 v-for="total in totals" style="font-weight: normal">
              {{headers[total.key]}}:
              {{total.amount | toFixed(2) | currency}}
            </h3>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card>
  </v-flex>
</template>

<script>
import { mapState } from 'vuex';
import axios from 'axios';

const qs = require('qs');

export default {
  data() {
    return {
      loaded: false,
      totals: [],
      headers: {
        'expensesSum': 'Suma wydatków',
        'incomesSum': 'Suma przychodów',
        'monthlyExpensesAvg': 'Średnie miesięczne wydatki',
        'monthlyIncomesAvg': 'Średnie miesięczne przychody',
      }
    };
  },
  computed: {
    ...mapState('reports', { selectedMonths: 'selectedMonths' }),
  },
  watch: {
    selectedMonths() {
      this.loadData();
    },
  },
  methods: {
    loadData() {
      const selectedMonths = this.selectedMonths
        .map(m => `${m.year}-${m.month}-01`);
      axios
        .get("/api/reports/totals", {
          params: { months: selectedMonths },
          paramsSerializer(params) {
            return qs.stringify(params, { arrayFormat: 'repeat' });
          },
        })
        .then((response) => {
          if (response.status !== 200) throw Error(response.message);

          this.totals = response.data.datasets.map(t => ({
            key: t.label,
            amount: t.data[0],
          }));
          this.loaded = true;
        });
    },
  },
};
</script>
