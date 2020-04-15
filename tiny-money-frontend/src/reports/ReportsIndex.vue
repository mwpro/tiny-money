<template>
  <v-container
    fluid
    grid-list-md
  >
    <h1>Raporty</h1>

    <v-layout row wrap>
      <v-flex
        v-bind="{ [`xs12`]: true }"
      >
        <v-card>
          <v-container
            fill-height
            fluid
            pa-2
          >
            <v-layout fill-height>
              <v-flex xs12 align-end flexbox>
                <span class="headline">Konfiguracja: rok (wszystkie)/miesiąc (wszystkie)</span>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
      <v-flex
        v-for="card in cards"
        :key="card.title"
        v-bind="{ [`xs${card.flex}`]: true }"
      >
        <v-card>
          <v-container
            fill-height
            fluid
            pa-2
          >
            <v-layout fill-height>
              <v-flex xs12 align-end flexbox>
                <span class="headline" v-text="card.title"></span>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  export default {
    name: "",
    data: () => ({
      cards: [
        {
          title: 'gauge: wydatki total',
          src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg',
          flex: 4
        },
        {
          title: 'gauge: budżet total',
          src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg',
          flex: 4
        },
        {
          title: 'gauge: realizacja budżetu +/- i %',
          src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg',
          flex: 4
        },
        {
          title: 'wykres słupkowy: y: wydatki (z rozdziałem na kategorie), x: miesiące. tylko dla miesiąc - wsztstkie',
          src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg',
          flex: 6
        },
        {
          title: 'wykres liniowy: y1: wydatki, y2: budżet, x: miesiące. Konfiguracja: tylko dla miesiąc - wszystkie',
          src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg',
          flex: 6
        },
        {
          title: 'wykres kołowy: wydatki - zewnętrzne koło kategorie, wewnątrz podział na subkategorie.',
          src: 'https://cdn.vuetifyjs.com/images/cards/road.jpg',
          flex: 6
        },
        {
          title: 'tabela: top sprzedawcy',
          src: 'https://cdn.vuetifyjs.com/images/cards/road.jpg',
          flex: 6
        },
        {
          title: 'tabela: top tagi',
          src: 'https://cdn.vuetifyjs.com/images/cards/road.jpg',
          flex: 6
        },
        {
          title: 'tabela: top transakcje',
          src: 'https://cdn.vuetifyjs.com/images/cards/road.jpg',
          flex: 6
        },
      ]
    })
  }
</script>

<style scoped>

</style>
