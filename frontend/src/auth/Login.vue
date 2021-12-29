<template>
  <div>
    <v-btn color="success" @click="login"><v-icon>security</v-icon> Zaloguj się</v-btn>
  </div>
</template>

<script>
export default {
  name: 'login',
  methods: {
    login() {
      this.$auth.login();
    },
  },
};
</script>
