var path = require('path');

module.exports = {
  entry: './input',
  output: {
    filename: 'output.js'
  },
  mode: 'development',
  resolve: {
    alias: {
      inferno: 'inferno/dist/inferno',
      'inferno-create-element': 'inferno-create-element/dist/inferno-create-element'
    },
    modules: [path.resolve('../../../../packages'), 'node_modules']
  }
};
