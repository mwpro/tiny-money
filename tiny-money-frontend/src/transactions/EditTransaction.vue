<template>
  <v-dialog v-model="isOpen" width="500">
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
                :return-value.sync="transaction.date"
                lazy
                transition="scale-transition"
                offset-y
                full-width
                min-width="290px"
              >
                <v-text-field
                  slot="activator"
                  v-model="transaction.date"
                  label="Data"
                  prepend-icon="event"
                  readonly
                ></v-text-field>
                <v-date-picker v-model="transaction.date" no-title scrollable>
                  <v-spacer></v-spacer>
                  <v-btn flat color="primary" @click="menu = false">Cancel</v-btn>
                  <v-btn flat color="primary" @click="$refs.menu.save(transaction.date)">OK</v-btn>
                </v-date-picker>
              </v-menu>
            </v-flex>
            <v-flex xs12>
              <v-text-field
                label="Kategoria*"
                v-model="transaction.category"
                prepend-icon="format_list_bulleted"
                required
              ></v-text-field>
            </v-flex>
            <v-flex xs12>
              <v-text-field
                label="Kwota*"
                v-model="transaction.amount"
                prepend-icon="attach_money"
                required
                suffix="PLN"
              ></v-text-field>
            </v-flex>
          </v-layout>
        </v-container>
        <!-- <small>*indicates required field</small> -->
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" flat @click="save()">Zapisz</v-btn>
        <v-btn color="blue darken-1" v-if="!isEditing" flat @click="saveAndAddNext()">
          Zapisz i dodaj następną
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      transaction: {
        date: new Date().toISOString().substr(0, 10),
      },
      isEditing: false,
      datePickerOpen: false,
    };
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
  },
  created() {
    // this.getCategory();
  },
  methods: {
    saveAndAddNext() {
      this.$store.dispatch(
        'transactions/addTransactionAction',
        this.transaction,
      );
      this.transaction = {
        date: new Date().toISOString().substr(0, 10),
      };
    },
    save() {
      this.$store.dispatch(
        'transactions/addTransactionAction',
        this.transaction,
      );
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
