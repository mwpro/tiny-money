<template>
  <v-data-table
    :headers="headers"
    :items="sellers"
    :pagination.sync="pagination"
    class="elevation-1"
  >
    <template v-slot:items="props">
      <td>{{ props.item.transactionDate }}</td>
      <td>{{ props.item.seller }}</td>
      <td>{{ props.item.category }}</td>
      <td class="text-xs-right">{{ props.item.amount | toFixed(2) | currency }}</td>
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
          sortBy: 'amount'
        },
        headers: [
          {text: 'Data', value: 'transactionDate'},
          {text: 'Sprzedawca', value: 'seller'},
          {text: 'Kategoria', value: 'category'},
          {text: 'Kwota', value: 'amount'},
        ],
        sellers: [
          {
            transactionDate: '2020-01-03',
            category: 'Mieszkanie',
            seller: 'PGE',
            amount: 210.32,
          },
          {
            transactionDate: '2020-02-06',
            category: 'Sprzęty',
            seller: 'x-kom',
            amount: 21120.32,
          },
          {
            transactionDate: '2020-03-12',
            category: 'Podróże',
            seller: 'KLM',
            amount: 2010.32,
          },
          {
            transactionDate: '2020-04-24',
            category: 'Abonamenty',
            seller: 'Netflix',
            amount: 50,
          },
        ]
      }
    }
  }
</script>
