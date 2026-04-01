import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default {
  entry: { app: './src/main.ts' },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  output: {
    clean: true,
    filename: process.env.NODE_ENV === 'production' ? "[name].[contenthash].js" : undefined,
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
    allowedHosts: 'all',
    client: {
      overlay: false,
    }
  },
  stats: 'errors-only',
}