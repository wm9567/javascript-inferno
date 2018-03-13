var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './input',
  output: {
    filename: 'output.js'
  },
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ],
  resolve: {
    modules: [path.resolve('../../../../packages'), 'node_modules']
  }
};
