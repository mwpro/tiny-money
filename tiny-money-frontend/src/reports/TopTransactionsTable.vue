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
            <span class="headline">TOP 50 transakcji</span>
            <v-data-table
              :loading="!loaded"
              :headers="headers"
              :items="topTransactions"
              :pagination.sync="pagination"
              class="elevation-1"
            >
              <template v-slot:items="props">
                <td>{{ props.item.transactionDate }}</td>
                <td>{{ props.item.seller }}</td>
                <td>{{ props.item.subcategory.fullName }}</td>
                <td class="text-xs-right">{{ props.item.amount | toFixed(2) | currency }}</td>
              </template>
            </v-data-table>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card>
  </v-flex>
</template>

<script>
  import {mapGetters, mapState} from "vuex";
  import axios from "axios";

  const qs = require('qs');

  export default {
    data() {
      return {
        loaded: false,
        pagination: {
          descending: true,
          page: 1,
          rowsPerPage: 5,
          sortBy: 'amount'
        },
        headers: [
          {text: 'Data', value: 'transactionDate'},
          {text: 'Sprzedawca', value: 'seller'},
          {text: 'Kategoria', value: 'subcategory'},
          {text: 'Kwota', value: 'amount'},
        ],
        topTransactions: []
      }
    },
    computed: {
      ...mapState('reports', {selectedMonths: 'selectedMonths'}),
      ...mapGetters('vendors', { vendors: 'vendors' }),
      ...mapGetters('categories', { subcategories: 'subcategories' }),
    },
    watch: {
      selectedMonths() {
        this.loadChart();
      }
    },
    methods: {
      loadChart() {
        let selectedMonths = this.selectedMonths
          .map(m => `${m.year}-${m.month}-01`);
        axios // todo use store here
          .get(`${process.env.VUE_APP_API_NEW}/api/reports/topTransactions`, {
              params: {months: selectedMonths},
              paramsSerializer: function (params) {
                return qs.stringify(params, {arrayFormat: 'repeat'})
              },
            }
          )
          .then((response) => {
            if (response.status !== 200) throw Error(response.message);

            this.topTransactions = response.data.map(t => {
              return {
                transactionDate: '2020-04-24',
                subcategory: this.subcategories.filter(v => v.id == t.subcategoryId)[0],
                seller: this.vendors.filter(v => v.id == t.vendorId)[0].name,
                amount: t.amount
              };
            });
            this.loaded = true;
          });
      }
    }
  }
</script>

