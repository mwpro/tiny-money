<template>
  <v-container>
    <v-layout row wrap>
      <v-flex>
        <v-data-table
          :headers="headers"
          :items="transactions"
          class="elevation-1"
          :hide-actions="true"
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

export default {
  components: { BufferRow },
  data() {
    return {
      headers: [
        {
          text: "Data",
          sortable: false,
          value: "date"
        },
        { text: "Opis", value: "fat", sortable: false },
        { text: "Kwota", value: "amount", sortable: false },        
        { text: "Sprzedawca", value: "vendor", sortable: false },
        {
          text: "Kategoria",
          sortable: false,
          value: "category"
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
  methods: {}
};
</script>
