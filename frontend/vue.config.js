module.exports = {
  devServer: {
    proxy: {
      '/api/transaction/buffer': {
        target: 'http://localhost:52386',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
};
