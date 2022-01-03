<template>
  <v-dialog v-model="isOpen" width="500" persistent>
    <v-card tile>
      <v-form ref="form" v-model="valid" @keyup.native.ctrl.enter="saveAndAddNext()">
        <v-toolbar card dark color="primary">
          <v-toolbar-title>Importuj transakcje</v-toolbar-title>
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
                <v-select
                  :items="types"
                  :rules="transactionsImportTypeRules"
                  v-model="transactionsImportType"
                  :return-object="true"
                  label="Rodzaj importu"
                ></v-select>
              </v-flex>
              <v-flex xs12 v-if="transactionsImportType && transactionsImportType.type === 'file'">
                <input type="file" @change="importFileSelected" accept="text/csv" />
              </v-flex>
              <v-flex xs12 v-if="transactionsImportType && transactionsImportType.type === 'copy-paste'">
                <v-textarea
                  label="Lista tranksacji"
                  v-model="transactionsImportData"
                  :rules="transactionsImportDataRules"
                  rows="10"
                ></v-textarea>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" flat @click="save()">Zapisz</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
export default {

  data() {
    return {
      transactionsImportData: null,
      transactionsImportDataRules: [
        v => !!v || 'Lista transakcji jest wymagana',
      ],
      transactionsImportType: null,
      transactionsImportTypeRules: [
        v => !!v || 'Rodzaj importu jest wymagany',
      ],
      valid: true,
      types: [  {
        text: 'Getin (tekst z przeglądarki)',
        value: 'getin',
        type: 'copy-paste'
      }, {
        text: 'ING (CSV)',
        value: 'ing',
        type: 'file',
        encoding: "windows-1250"
      }, {
        text: 'Pekao (CSV)',
        value: 'pekao',
        type: 'file',
        encoding: 'utf-8'
      }]
    };
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
  },
  methods: {
    importFileSelected(event) {
      const reader = new FileReader();
      reader.onload = () => {
       this.transactionsImportData = reader.result;
      }
      reader.readAsText(event.target.files[0], this.transactionsImportType.encoding);
    },
    save() {
      this.$refs.form.validate();
      if (!this.valid) {
        this.$store.dispatch(
          'displayErrorSnack',
          'Dane importu są niepoprawne',
          { root: true },
        );
        return;
      }
      this.$store
        .dispatch('buffer/importTransactionsAction', {
          transactions: this.transactionsImportData,
          type: this.transactionsImportType.value
        })
        .then(result => {
          this.$store.dispatch('displaySuccessSnack', `Import zakończony sukcesem - ${result.numberOfImportedTransactions} zaimportowanych transakcji`, {
            root: true,
          });
          this.close();
        })
        .catch((error) => {
          this.$store.dispatch(
            'displayErrorSnack',
            'Błąd przy imporcie transakcji',
            { root: true },
          );
        });
    },
    close() {
      this.$emit('closed');
      this.$refs.form.reset();
    },
  },
};
</script>

<style>
</style>
