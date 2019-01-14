<template>
  <v-layout row wrap>
    <v-flex>
      <v-data-table :headers="headers" :items="transactions" class="elevation-1">
        <template slot="items" slot-scope="props">
          <td class="text-xs-left">{{ props.item.date }}</td>
          <td class="text-xs-left">{{ props.item.category }}</td>
          <td class="text-xs-left">{{ props.item.amount }}</td>
        </template>
      </v-data-table>
    </v-flex>
  </v-layout>
</template>
<script>
export default {
  data() {
    return {
      headers: [
        {
          text: 'Data',
          sortable: false,
          value: 'date',
        },
        {
          text: 'Kategoria',
          sortable: false,
          value: 'category',
        },
        // { text: 'Sprzedawca', value: 'calories', sortable: false },
        // { text: 'Tagi', value: 'fat', sortable: false },
        { text: 'Kwota', value: 'amount', sortable: false },
      ],
    };
  },
  computed: {
    transactions() {
      return this.$store.state.transactions.transactionsList;
    },
  },
  created() {
    this.$store.dispatch('transactions/getTransactionsAction');
  },
};
</script>
