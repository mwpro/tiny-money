<template>
  <v-container>
    <edit-transaction :isOpen="isEditTransactionActive" :editedTransactionId="editedTransactionId" @closed="isEditTransactionActive=false"/>
    <v-dialog v-model="isDeleteTransactionActive" persistent max-width="400">
      <v-card>
        <v-card-title class="headline">Czy na pewno chcesz usunąć transakcję?</v-card-title>
                <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat @click="isDeleteTransactionActive = false">Nie</v-btn>
          <v-btn color="green darken-1" flat @click="deleteTransaction()">Tak</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-btn color="green" fab bottom right dark fixed @click="openAddTransaction()">
      <v-icon>add</v-icon>
    </v-btn>
    <v-layout row wrap>
      <v-flex>
        <v-data-table
          :headers="headers"
          :items="transactions"
          class="elevation-1"
          :hide-actions="true"
        >
          <template slot="items" slot-scope="props">
            <tr>
              <td class="text-xs-left">{{ props.item.transactionDate | date }}</td>
              <td
                class="text-xs-left"
                :class="props.item.amount > 0 ? 'red--text' : 'green--text'"
              >{{ props.item.amount | toFixed(2) | currency }}</td>
              <td class="text-xs-left">
                {{ props.item.rawBankStatementDescription }}
              </td>
              <td class="text-xs-left">
                <!-- {{ props.item.subcategory.parentCategory.name }} / {{ props.item.subcategory.name }} -->
              </td>
              <td class="text-xs-left">
                <!-- {{ props.item.vendor.name }} -->
              </td>
              <td class="text-xs-left">
                <!-- {{ props.item.vendor.name }} -->
              </td>
              <td class="text-xs-left">
                <v-icon @click="openEditTransaction(props.item.id)">check</v-icon>                
                <v-icon @click="openDeleteTransaction(props.item.id)">close</v-icon>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
import EditTransaction from '../transactions/EditTransaction.vue';

export default {
  components: { EditTransaction },
  data() {
    return {
      searchOptions: {
        month: new Date().toISOString().substr(0, 7),
        myTransactionsOnly: false,
      },
      isEditTransactionActive: false,
      isDeleteTransactionActive: false,
      editedTransactionId: null,
      transactionToDeleteId: null,
      headers: [
        {
          text: 'Data',
          sortable: false,
          value: 'date',
        },        
        { text: 'Opis', value: 'fat', sortable: false },
        { text: 'Kwota', value: 'amount', sortable: false },
        {
          text: 'Kategoria',
          sortable: false,
          value: 'category',
        },
        { text: 'Sprzedawca', value: 'vendor', sortable: false },
        { text: 'Tagi', value: 'fat', sortable: false },
        { text: '', value: '', sortable: false },
      ],
    };
  },
  computed: {
    transactions() {
      return this.$store.state.buffer.transactionsList;
    },
  },
  created() {
    this.searchOptions.month = `${this.searchOptions.month}-01`;
    this.$store.dispatch(
        'buffer/getTransactionsAction'
      );
  },
  methods: {
    openAddTransaction() {
      this.editedTransactionId = null;
      this.isEditTransactionActive = true;
    },
    openEditTransaction(id) {
      this.editedTransactionId = id;
      this.isEditTransactionActive = true;
    },
    openDeleteTransaction(id) {
      this.transactionToDeleteId = id;
      this.isDeleteTransactionActive = true;
    },
    deleteTransaction() {
      this.$store.dispatch('transactions/deleteTransactionAction', this.transactionToDeleteId)
        .then(() => {
          this.isDeleteTransactionActive = false;
          this.$store.dispatch('displaySuccessSnack', 'Transakcja usunięta', {
            root: true,
          });
        })
        .catch(() => {
          this.$store.dispatch(
            'displayErrorSnack',
            'Błąd przy usuwaniu transakcji',
            { root: true },
          );
        });
    },
    selectMonth() {
      // TODO appending '-01' does not seem to be the best practice :)
      this.searchOptions.month = `${this.searchOptions.month}-01`;
      this.$refs.menu.save(this.searchOptions.month);
      this.search();
    },
    search() {
      this.$store.dispatch(
        'transactions/getTransactionsAction',
        this.searchOptions,
      );
    },
  },
};
</script>
