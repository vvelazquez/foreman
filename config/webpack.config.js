'use strict';

var path = require('path');
var webpack = require('webpack');
var StatsPlugin = require('stats-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CompressionPlugin = require('compression-webpack-plugin');

// must match config.webpack.dev_server.port
var devServerPort = 3808;

// set TARGETNODE_ENV=production on the environment to add asset fingerprints
var production =
  process.env.RAILS_ENV === 'production' ||
  process.env.NODE_ENV === 'production';

var config = {
  entry: {
    // Sources are expected to live in $app_root/webpack
    bundle: './webpack/assets/javascripts/bundle.js'
  },

  output: {
    // Build assets directly in to public/webpack/, let webpack know
    // that all webpacked assets start with webpack/

    // must match config.webpack.output_dir
    path: path.join(__dirname, '..', 'public', 'webpack'),
    publicPath: '/webpack/',

    filename: production ? '[name]-[chunkhash].js' : '[name].js'
  },

  resolve: {
    modules: [
      path.join(__dirname, '..', 'webpack'),
      path.join(__dirname, '..', 'node_modules')
    ]
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },
      {
        test: /(\.png|\.gif)$/,
        loader: 'url-loader?limit=32767'
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader', // The backup style loader
          use: 'css-loader?sourceMap!sass-loader?sourceMap'
        })
      }
    ]
  },

  plugins: [
    // must match config.webpack.manifest_filename
    new StatsPlugin('manifest.json', {
      // We only need assetsByChunkName
      chunkModules: false,
      source: false,
      chunks: false,
      modules: false,
      assets: true
    }),
    new ExtractTextPlugin({
      filename: production ? '[name]-[chunkhash].css' : '[name].css',
      allChunks: true
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(production ? 'production' : 'development'),
        NOTIFICATIONS_POLLING: process.env.NOTIFICATIONS_POLLING
      }
    })
  ]
};

if (production) {
  config.plugins.push(
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compressor: { warnings: false },
      sourceMap: false
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new CompressionPlugin()
  );
} else {
  config.plugins.push(
    new webpack.HotModuleReplacementPlugin() // Enable HMR
  );
  require('dotenv').config();

  config.devServer = {
    host: process.env.BIND || 'localhost',
    port: devServerPort,
    headers: { 'Access-Control-Allow-Origin': '*' },
    hot: true
  };
  // Source maps
  config.devtool = 'inline-source-map';
}

module.exports = config;
