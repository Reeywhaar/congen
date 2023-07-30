const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: { app: './src/main.ts' },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  output: {
    clean: true
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
        resolve: { fullySpecified: false }
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        resolve: { fullySpecified: false }
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: "index.html" }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "img", to: "img" },
        { from: "assets" },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
  },
  stats: 'errors-only',
}