const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const url = require('url');

// public path
const publicPath = "/build/";

// js file names
const jsFileNames = {
  development : "app.js",
  production : "app.min.js",
};

// css file names
const cssFileNames = {
  development : "app.css",
  production : "app.min.css",
};

// currently js/css file name
const jsFileName = jsFileNames[process.env.NODE_ENV];
const cssFileName = cssFileNames[process.env.NODE_ENV];

// define base webpack plugins
const webpackPlugins = [
  // import react hot loader
  new webpack.HotModuleReplacementPlugin(),
  // provide plugins? to global
  new webpack.ProvidePlugin({}),
  // define environment
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV)
    }
  }),
];

// configure
switch (process.env.NODE_ENV) {
  case "production":
    // enable js compress
    webpackPlugins.push(new webpack.optimize.UglifyJsPlugin({
      compressor : {
        warnings : false
      }
    }));
    // unite all css to one file
    webpackPlugins.push(new ExtractTextPlugin({
      filename : cssFileName,
      allChunks : true
    }));
    // optimize css assets
    webpackPlugins.push(new OptimizeCssAssetsPlugin());
    // compress css/js
    webpackPlugins.push(new CompressionPlugin({
      test: /\.(css|js)$/,
      algorithm: "gzip",
      threshold: 10240,
      minRatio: 0.8
    }));
  break;
  case "development":
  default:
    // unite all css to one file
    webpackPlugins.push(new ExtractTextPlugin({
      filename : cssFileName,
      allChunks : true
    }));
  break;
}

module.exports = {
  entry: "./client/index.js",
  output: {
    path: __dirname + '/public/build/',
    publicPath: publicPath,
    filename: jsFileName
  },
  plugins: webpackPlugins,
  resolve : {
    alias : {
    },
  },
  module: {
    loaders: [
      {
        test: /\.(woff2?|ttf|eot|svg|otf)$/,
        loader: 'file-loader',
        options: {
          name: path => {
            if (! /node_modules|bower_components/.test(path)) {
                return 'fonts/[name].[ext]?[hash]';
            }

            return 'fonts/vendor/' + path
                .replace(/\\/g, '/')
                .replace(
                    /((.*(node_modules|bower_components))|fonts|font|assets)\//g, ''
                ) + '?[hash]';
          },
          publicPath: publicPath
        }
      },
      {
        test: /\.(png|jpe?g|gif)$/,
        loaders: [
            {
                loader: 'file-loader',
                options: {
                    name: path => {
                        if (! /node_modules|bower_components/.test(path)) {
                            return 'images/[name].[ext]?[hash]';
                        }

                        return 'images/vendor/' + path
                            .replace(/\\/g, '/')
                            .replace(
                                /((.*(node_modules|bower_components))|images|image|img|assets)\//g, ''
                            ) + '?[hash]';
                    },
                    publicPath: publicPath
                }
            },
            'img-loader'
        ]
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.s[ac]ss$/,
        loader : ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader!sass-loader"
        }),
      },
      {
        test: /\.less$/,
        loader : ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader!less-loader"
        }),
      },
      {
        test: /\.css$/,
        loader : ExtractTextPlugin.extract({
          fallback : 'style-loader',
          use : 'css-loader'
        }),
      }
    ]
  }
}