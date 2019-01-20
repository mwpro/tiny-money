<template>
  <v-dialog v-model="isOpen" width="500" persistent>
    <v-card tile>
      <v-toolbar card dark color="primary">
        <v-toolbar-title>Utwórz budżet</v-toolbar-title>
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
              {{ initializeMode }}
              <v-radio-group v-model="initializeMode" :mandatory="false">
                <v-radio label="Pusty" value="empty"></v-radio>
                <v-radio :label="``" value="copy">
                  <div slot="label">Skopiuj z
                    <v-menu
                      ref="menu"
                      :close-on-content-click="false"
                      :nudge-right="40"
                      :return-value.sync="sourceMonth"
                      lazy
                      transition="scale-transition"
                      offset-y
                      full-width
                      max-width="290px"
                      min-width="290px"
                    >
                      <span slot="activator">{{ sourceMonth }}</span>
                      <v-date-picker
                        v-model="sourceMonth"
                        type="month"
                        no-title
                        scrollable
                        @input="$refs.menu.save(sourceMonth)"
                      ></v-date-picker>
                    </v-menu>
                  </div>
                </v-radio>
              </v-radio-group>
            </v-flex>
            <v-flex></v-flex>
          </v-layout>
        </v-container>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" flat @click="save()">Utwórz</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      isOpen: true,
      initializeMode: "empty",
      sourceMonth: null
    };
  },
  created() {
    var sourceMonth = new Date();
    sourceMonth.setMonth(sourceMonth.getMonth() - 1);
    this.sourceMonth = sourceMonth.toISOString().substr(0, 7);
  }
};
</script>