const webpack = require("webpack");

module.exports = {
  devServer: {
    port: 3000,
    disableHostCheck: true
  },
  configureWebpack: {
    plugins: [
      new webpack.ProvidePlugin({
        $: "jquery",
        jquery: "jquery",
        "window.jQuery": "jquery",
        jQuery: "jquery"
      })
    ]
  }
};
