/**
 * فایل پیکربندی TypeScript
 * تنظیمات کامپایل و بیلد
 */

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = argv.mode === 'development';

  return {
    mode: argv.mode || 'development',
    entry: {
      main: './src/index.ts',
      kernel: './src/kernel.ts',
      ide: './src/ide.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction
        ? 'js/[name].[contenthash:8].js'
        : 'js/[name].js',
      chunkFilename: isProduction
        ? 'js/[name].[contenthash:8].chunk.js'
        : 'js/[name].chunk.js',
      publicPath: '/',
      clean: true,
      library: {
        type: 'umd',
        name: 'IDE3D',
      },
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: {
        '@services': path.resolve(__dirname, 'src/services'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@': path.resolve(__dirname, 'src'),
      },
    },

    module: {
      rules: [
        {
          test: /\.ts(x)?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              experimentalWatchApi: true,
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024,
            },
          },
        },
        {
          test: /\.glsl$/,
          use: 'raw-loader',
        },
      ],
    },

    plugins: [
      // تولید HTML
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        chunks: ['main'],
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
        } : false,
      }),

      // تعریف متغیرهای محیطی
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode || 'development'),
        'process.env.VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
        'process.env.OFFLINE_MODE': JSON.stringify(process.env.OFFLINE_MODE === 'true'),
        'process.env.KERNEL_HOST': JSON.stringify(process.env.KERNEL_HOST || 'localhost'),
        'process.env.KERNEL_PORT': JSON.stringify(process.env.KERNEL_PORT || '3000'),
        'process.env.USE_SSL': JSON.stringify(process.env.USE_SSL === 'true'),
        'process.env.SSH_ENABLED': JSON.stringify(process.env.SSH_ENABLED === 'true'),
      }),

      // تحلیل بسته (اختیاری)
      ...(process.env.ANALYZE === 'true'
        ? [new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-report.html',
        })]
        : []),
    ],

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
            },
            output: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            name: 'common',
          },
          threejs: {
            test: /[\\/]node_modules[\\/]three[\\/]/,
            name: 'three',
            priority: 20,
          },
        },
      },
      runtimeChunk: {
        name: 'runtime',
      },
    },

    devServer: {
      port: 8080,
      hot: true,
      compress: true,
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
        'Cache-Control': 'no-cache',
      },
      proxy: {
        '/api': {
          target: process.env.KERNEL_HOST || 'http://localhost:3000',
          pathRewrite: { '^/api': '' },
          changeOrigin: true,
          secure: process.env.USE_SSL === 'true',
          ws: true,
        },
        '/kernel': {
          target: process.env.KERNEL_HOST || 'http://localhost:3000',
          pathRewrite: { '^/kernel': '' },
          changeOrigin: true,
          secure: process.env.USE_SSL === 'true',
          ws: true,
        },
      },
    },

    devtool: isDevelopment ? 'source-map' : false,

    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },

    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
    },

    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '.webpack_cache'),
      buildDependencies: {
        config: [__filename],
      },
    },
  };
};
