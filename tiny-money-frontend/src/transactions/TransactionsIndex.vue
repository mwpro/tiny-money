<template>
  <v-layout row wrap>
    <edit-transaction :isOpen="isEditTransactionActive" @closed="isEditTransactionActive=false" />
    <v-btn color="green" fab bottom right dark fixed @click="openAddTransaction()">
      <v-icon>add</v-icon>
    </v-btn>
    <v-flex>
      <v-data-table :headers="headers" :items="transactions" class="elevation-1">
        <template slot="items" slot-scope="props">
          <td class="text-xs-left">{{ props.item.date }}</td>
          <td class="text-xs-left">{{ props.item.category }}</td>
          <td class="text-xs-left" :class="props.item.amount > 0 ? 'green--text' : 'red--text'" >{{ props.item.amount | toFixed(2) | currency }}</td>
        </template>
      </v-data-table>
    </v-flex>
  </v-layout>
</template>
<script>
import EditTransaction from './EditTransaction.vue';


export default {
  components: { EditTransaction },
  data() {
    return {
      isEditTransactionActive: false,
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
  methods: {
    openAddTransaction() {
      this.isEditTransactionActive = true;
    },
  },
};
</script>
