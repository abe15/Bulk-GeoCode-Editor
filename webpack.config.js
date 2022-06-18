module.exports = {
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
          enforceExtension: false,
          extensions: ['.ts', '.js', '.mjs'],
        },
      },
    ],
  },
};
