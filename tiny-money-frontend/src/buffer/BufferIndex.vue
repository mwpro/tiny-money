<template>
  <v-container>
    <v-btn color="green" fab bottom right dark fixed @click="openImportTransactions()">
      <v-icon>add</v-icon>
    </v-btn>
    <import-transactions :isOpen="isImportTransactionsActive" @closed="isImportTransactionsActive=false"/>
    <v-layout row wrap>
      <v-flex>
        <v-data-table
          :headers="headers"
          :items="transactions"
          class="elevation-1"
          :rows-per-page-items=[10,25,50]
        >
          <template slot="items" slot-scope="props">
            <buffer-row :buffered-transaction="props.item" />
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
import BufferRow from "./BufferRow.vue";
import ImportTransactions from './ImportTransactions.vue';

export default {
  components: { BufferRow, ImportTransactions },
  data() {
    return {
      isImportTransactionsActive: false,
      headers: [
        {
          text: "Data",
          sortable: false,
          value: "date"
        },
        { text: "Kwota", value: "amount", sortable: false },        
        { text: "Opis", value: "fat", sortable: false },
        { text: "Sprzedawca", value: "vendor", sortable: false },
        {
          text: "Kategoria",
          sortable: false,
          value: "category"
        },
        {
          text: "Opis",
          sortable: false,
          value: "description"
        },
        { text: "Tagi", value: "fat", sortable: false },
        { text: "", value: "", sortable: false }
      ]
    };
  },
  computed: {
    transactions() {
      return this.$store.state.buffer.transactionsList;
    }
  },
  created() {
    this.$store.dispatch("buffer/getTransactionsAction");
    // gets below should happen in BufferRow 🤔
    this.$store.dispatch('categories/getCategories');
    this.$store.dispatch('tags/getTagsAction');
    this.$store.dispatch('vendors/getVendorsAction');
  },
  methods: {
    openImportTransactions() {
      this.isImportTransactionsActive = true;
    }
  }
};
</script>
