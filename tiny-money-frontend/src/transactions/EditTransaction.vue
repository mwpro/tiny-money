<template>
  <v-dialog v-model="isOpen" width="500" persistent>
    <v-card tile>
      <v-toolbar card dark color="primary">
        <v-toolbar-title>
          {{ isEditing ? `Edytuj transakcję` : "Dodaj transakcję" }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn icon dark @click="close()">
            <v-icon>close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-card-text>
        <v-container grid-list-md>
          <v-layout wrap>
            <v-flex xs12>
              <v-menu
                ref="menu"
                :close-on-content-click="false"
                v-model="datePickerOpen"
                :nudge-right="40"
                :return-value.sync="transaction.transactionDate"
                lazy
                transition="scale-transition"
                offset-y
                full-width
                min-width="290px"
              >
                <v-text-field
                  slot="activator"
                  v-model="transaction.transactionDate"
                  label="Data"
                  prepend-icon="event"
                  readonly
                ></v-text-field>
                <v-date-picker v-model="transaction.transactionDate" no-title scrollable>
                  <v-spacer></v-spacer>
                  <v-btn flat color="primary" @click="menu = false">Cancel</v-btn>
                  <v-btn
                    flat
                    color="primary"
                    @click="$refs.menu.save(transaction.transactionDate)"
                  >OK</v-btn>
                </v-date-picker>
              </v-menu>
            </v-flex>
            <v-flex xs12>
              <v-autocomplete
                v-model="transaction.subcategoryId"
                :items="subcategories"
                item-text="fullName"
                item-value="id"
                label="Kategoria*"
                persistent-hint
                prepend-icon="format_list_bulleted"
                required
              >
                <v-slide-x-reverse-transition slot="append-outer" mode="out-in">
                  <v-icon
                    :color="isEditing ? 'success' : 'info'"
                    :key="`icon-${isEditing}`"
                    @click="isEditing = !isEditing"
                    v-text="isEditing ? 'mdi-check-outline' : 'mdi-circle-edit-outline'"
                  ></v-icon>
                </v-slide-x-reverse-transition>
              </v-autocomplete>
            </v-flex>
            <v-flex xs2>
              <v-btn :color="transaction.isExpense ? 'red' : 'green'" fab small @click="transaction.isExpense = !transaction.isExpense">
                <v-icon>{{ transaction.isExpense ? 'remove' : 'add' }}</v-icon>
              </v-btn>
              <!-- <v-switch :color="transaction.isExpense ? 'red' : 'green'"
              :label="transaction.isExpense ? 'wydatek' : 'przychód'"
               v-model="transaction.isExpense">
              </v-switch> -->
            </v-flex>
            <v-flex xs10>
              <v-text-field
                :label="`Kwota ${ transaction.isExpense ? 'wydatku' : 'przychodu' }*`"
                prepend-icon="attach_money"
                :color="transaction.isExpense ? 'red' : 'green'"
                v-model="transaction.amount"
                required
                suffix="PLN"
              ></v-text-field>
            </v-flex>
          </v-layout>
        </v-container>
        <!-- <small>*indicates required field</small> -->
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" flat @click="save()">Zapisz</v-btn>
        <v-btn
          color="blue darken-1"
          v-if="!isEditing"
          flat
          @click="saveAndAddNext()"
        >Zapisz i dodaj następną</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  data() {
    return {
      transaction: {
        transactionDate: new Date().toISOString().substr(0, 10),
        subcategoryId: null,
        isExpense: true,
        amount: null,
      },
      valid: true,
      isEditing: false,
      datePickerOpen: false,
    };
  },
  computed: {
    ...mapState('categories', { categories: 'categoriesList' }),
    ...mapGetters('categories', { subcategories: 'subcategories' }),
  },
  created() {
    this.$store.dispatch('categories/getCategories');
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
  },
  methods: {
    saveAndAddNext() {
      this.$store.dispatch(
        'transactions/addTransactionAction',
        this.transaction,
      );
      this.transaction = {
        transactionDate: new Date().toISOString().substr(0, 10),
        subcategoryId: null,
        isExpense: true,
        amount: null,
      };
    },
    save() {
      this.$store.dispatch(
        'transactions/addTransactionAction',
        this.transaction,
      );
      this.transaction = {
        transactionDate: new Date().toISOString().substr(0, 10),
        subcategoryId: null,
        isExpense: true,
        amount: null,
      };
      this.close();
    },
    close() {
      this.$emit('closed');
    },
  },
};
</script>

<style>
</style>
