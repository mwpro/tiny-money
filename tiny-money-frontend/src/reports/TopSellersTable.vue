<template>
  <v-data-table
    :headers="headers"
    :items="sellers"
    :pagination.sync="pagination"
    class="elevation-1"
  >
    <template v-slot:items="props">
      <td>{{ props.item.name }}</td>
      <td class="text-xs-right">{{ props.item.sum | toFixed(2) | currency }}</td>
    </template>
  </v-data-table>
</template>

<script>
  export default {
    data() {
      return {
        pagination: {
          descending: true,
          page: 1,
          rowsPerPage: 10,
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
        sellers: [
          {
            name: 'PGE',
            sum: 210.32,
          },
          {
            name: 'x-kom',
            sum: 7543,
          },
          {
            name: 'Netflix',
            sum: 50,
          },
          {
            name: 'Carrefour',
            sum: 1521,
          },
          {
            name: 'KLM',
            sum: 3093,
          },
          {
            name: 'WTP',
            sum: 304,
          },
        ]
      }
    }
  }
</script>
