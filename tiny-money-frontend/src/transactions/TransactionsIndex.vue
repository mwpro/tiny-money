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
      <v-flex xs11 sm5>
        <v-menu
          ref="menu"
          :close-on-content-click="false"
          :nudge-right="40"
          :return-value.sync="searchOptions.month"
          lazy
          transition="scale-transition"
          offset-y
          full-width
          max-width="290px"
          min-width="290px"
        >
          <v-text-field
            slot="activator"
            v-model="searchOptions.month"
            label="Okres transakcji"
            prepend-icon="event"
            readonly
          ></v-text-field>
          <v-date-picker
            v-model="searchOptions.month"
            type="month"
            no-title
            scrollable
            @input="selectMonth()"
          >
            <v-spacer></v-spacer>
          </v-date-picker>
        </v-menu>
      </v-flex>
      <v-flex xs11 sm5>
        <v-switch
          prepend-icon="person"
          label="Tylko moje transakcje"
          v-model="searchOptions.myTransactionsOnly"
          @change="search()"
        ></v-switch>
      </v-flex>
      <v-spacer></v-spacer>
    </v-layout>
    <v-layout row wrap>
      <v-flex>
        <v-data-table
          :headers="headers"
          :items="transactions"
          class="elevation-1"
          :hide-actions="true"
        >
          <template slot="items" slot-scope="props">
            <tr @click="props.expanded = !props.expanded">
              <td class="text-xs-left">{{ props.item.transactionDate | date }}</td>
              <td
                class="text-xs-left"
              >{{ props.item.subcategory.parentCategory.name }} / {{ props.item.subcategory.name }}</td>
              <td class="text-xs-left">{{ props.item.vendor.name }}</td>
              <td
                class="text-xs-left"
                :class="props.item.isExpense ? 'red--text' : 'green--text'"
              >{{ props.item.amount | toFixed(2) | currency }}</td>
              <td class="text-xs-left">
                <v-icon v-if="props.item.description">notes</v-icon>
                <v-icon v-if="props.item.tags.length">#</v-icon>
              </td>
            </tr>
          </template>
          <template slot="expand" slot-scope="props">
            <v-card flat>
              <v-card-text>
                Data dodania: {{ props.item.createdDate | date }}
                <br>
                Data aktualizacji: {{ props.item.modifiedDate | date }}
                <br>Tagi:
                <span v-if="!props.item.tags.length">brak</span>
                <v-chip
                  v-for="tag in props.item.tags"
                  :key="tag.id"
                  color="primary"
                  small
                  text-color="white"
                >{{ tag.name }}</v-chip>
                <br>
                Opis:
                <span v-if="!props.item.description">brak</span>
                {{ props.item.description }}
                <br />
                Dodana przez: {{ props.item.createdBy }}
                <br>
                <v-btn @click="openEditTransaction(props.item.id)">
                  <v-icon>edit</v-icon>
                </v-btn>
                <v-btn @click="openDeleteTransaction(props.item.id)">
                  <v-icon>delete</v-icon>
                </v-btn>
              </v-card-text>
            </v-card>
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
import EditTransaction from './EditTransaction.vue';

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
        {
          text: 'Kategoria',
          sortable: false,
          value: 'category',
        },
        { text: 'Sprzedawca', value: 'vendor', sortable: false },
        // { text: 'Tagi', value: 'fat', sortable: false },
        { text: 'Kwota', value: 'amount', sortable: false },
        { text: '', value: '', sortable: false },
      ],
    };
  },
  computed: {
    transactions() {
      return this.$store.state.transactions.transactionsList;
    },
  },
  created() {
    this.searchOptions.month = `${this.searchOptions.month}-01`;
    this.search();
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
