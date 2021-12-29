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
            <span class="headline">TOP 50 sprzedawców</span>
            <v-data-table
              :loading="!loaded"
              :headers="headers"
              :items="topVendors"
              :pagination.sync="pagination"
              class="elevation-1"
            >
              <template v-slot:items="props">
                <td>{{ props.item.name }}</td>
                <td class="text-xs-right">{{ props.item.sum | toFixed(2) | currency }}</td>
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
          sortBy: 'sum'
        },
        headers: [
          {
            text: 'Nazwa',
            align: 'left',
            value: 'name'
          },
          {text: 'Suma', value: 'sum'},
        ],
        topVendors: [
        ]
      }
    },
    computed: {
      ...mapState('reports', {selectedMonths: 'selectedMonths'}),
      ...mapGetters('vendors', { vendors: 'vendors' }),
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
          .get("/api/reports/topVendors", {
              params: {months: selectedMonths},
              paramsSerializer: function (params) {
                return qs.stringify(params, {arrayFormat: 'repeat'})
              },
            }
          )
          .then((response) => {
            if (response.status !== 200) throw Error(response.message);

            this.topVendors = response.data.labels.map((vendorId, i) => {
              return {
                name: this.vendors.filter(v => v.id == vendorId)[0].name,
                sum: response.data.datasets[0].data[i]
              };
            });

            this.loaded = true;
          });
      }
    }
  }
</script>
