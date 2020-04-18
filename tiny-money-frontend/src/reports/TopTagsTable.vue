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
            name: 'Remont',
            sum: 9440,
          },
          {
            name: 'Wakacje 2019',
            sum: 7543,
          },
          {
            name: 'Wakacje 2020',
            sum: 200,
          }
        ]
      }
    }
  }
</script>
