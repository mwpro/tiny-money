<template>
  <tr>
    <td class="text-xs-left">{{ bufferedTransaction.transactionDate | date }}</td>
    <td
      class="text-xs-left"
      :class="bufferedTransaction.amount > 0 ? 'red--text' : 'green--text'"
    >{{ bufferedTransaction.amount | toFixed(2) | currency }}</td>
    <td class="text-xs-left">{{ bufferedTransaction.rawBankStatementDescription }}</td>
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
      <v-icon @click="openEditTransaction(bufferedTransaction.id)">check</v-icon>
      <v-icon @click="openRejectTransaction(bufferedTransaction.id)">close</v-icon>
    </td>
    <v-dialog v-model="isRejectTransactionActive" persistent max-width="600"><!-- TODO move to other component -->
      <v-card>
        <v-card-title class="headline">Czy na pewno chcesz odrzucić transakcję?</v-card-title>
        <v-card-text>
            Kwota: {{ bufferedTransaction.amount | currency }}<br />
            {{ bufferedTransaction.rawBankStatementDescription }}            
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat @click="isRejectTransactionActive = false">Nie</v-btn>
          <v-btn color="green darken-1" flat @click="rejectTransaction()">Tak</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </tr>
</template>

<script>
export default {
  data() {
      return {
        isRejectTransactionActive: false,
      }
  },
  props: {
    bufferedTransaction: Object
  },
  methods: {
    openRejectTransaction(id) {
      this.isRejectTransactionActive = true;
    },
    rejectTransaction() {
      this.$store
        .dispatch("buffer/rejectTransactionAction", this.bufferedTransaction.id)
        .then(() => {
          this.isRejectTransactionActive = false;
          this.$store.dispatch("displaySuccessSnack", "Transakcja usunięta", {
            root: true
          });
        })
        .catch(() => {
          this.$store.dispatch(
            "displayErrorSnack",
            "Błąd przy usuwaniu transakcji",
            { root: true }
          );
        });
    }
  }
};
</script>

<style>
</style>