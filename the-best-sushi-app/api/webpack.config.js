const path = require('path')
const slsw = require('serverless-webpack')
const Dotenv = require('dotenv-webpack')

module.exports = {
  target: 'node',
  entry: slsw.lib.entries,
  output: {
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js'
  },
  devtool: 'eval',
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [__dirname],
        exclude: /node_modules/
      }
    ]
  },
  externals: ['aws-sdk'],
  plugins: [
    new Dotenv()
  ]
}
