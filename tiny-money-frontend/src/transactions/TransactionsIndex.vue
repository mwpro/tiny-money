<template>
<v-container>
    <edit-transaction :isOpen="isEditTransactionActive" @closed="isEditTransactionActive=false"/>
    <v-btn color="green" fab bottom right dark fixed @click="openAddTransaction()">
      <v-icon>add</v-icon>
    </v-btn>
  <v-layout row wrap>
    <v-flex xs11 sm5>
      <v-menu
        ref="menu"
        :close-on-content-click="false"
        v-model="selectMonthPickeropen"
        :nudge-right="40"
        :return-value.sync="selectedMonth"
        lazy
        transition="scale-transition"
        offset-y
        full-width
        max-width="290px"
        min-width="290px"
      >
        <v-text-field
          slot="activator"
          v-model="selectedMonth"
          label="Okres transakcji"
          prepend-icon="event"
          readonly
        ></v-text-field>
        <v-date-picker
          v-model="selectedMonth"
          type="month"
          no-title
          scrollable
        >
          <v-spacer></v-spacer>
          <v-btn flat color="primary" @click="selectMonthPickeropen = false">Cancel</v-btn>
          <v-btn flat color="primary" @click="$refs.menu.save(selectedMonth)">OK</v-btn>
        </v-date-picker>
      </v-menu>
    </v-flex>
    <v-spacer></v-spacer>
  </v-layout>
  <v-layout row wrap>
    <v-flex>
      <v-data-table :headers="headers" :items="transactions" class="elevation-1" pagination.rowsPerPage="10">
        <template slot="items" slot-scope="props">
          <tr @click="props.expanded = !props.expanded">
            <td class="text-xs-left">{{ props.item.transactionDate | date }}</td>
            <td
              class="text-xs-left"
            >{{ props.item.subcategory.parentCategory.name }} / {{ props.item.subcategory.name }}</td>
            <td
              class="text-xs-left"
              :class="props.item.isExpense ? 'red--text' : 'green--text'"
            >{{ props.item.amount | toFixed(2) | currency }}</td>
          </tr>
        </template>
        <template slot="expand" slot-scope="props">
          <v-card flat>
            <v-card-text>
              Data dodania: {{ props.item.createdDate | date }}<br/>
              Data aktualizacji: {{ props.item.modifiedDate | date }}
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
      selectedMonth: new Date().toISOString().substr(0, 7),
      selectMonthPickeropen: false,
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
