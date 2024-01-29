const path = require('path')
const webpack = require('webpack')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const DotenvPlugin = require('dotenv-webpack')
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const { GenerateSW } = require('workbox-webpack-plugin')

const IS_DEV = process.env.NODE_ENV === 'development'

/** @type { import('webpack').Configuration } */
module.exports = {
  mode: process.env.NODE_ENV,
  entry: './src/main.tsx',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.m?(j|t)sx?$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
                dynamicImport: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  refresh: IS_DEV,
                },
              },
            },
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [new TsconfigPathsPlugin()],
  },
  output: {
    clean: true,
    filename: '[name].[chunkhash:8].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  optimization: {
    // minimize: true,
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      minSize: 5000,
      cacheGroups: {
        reactVendor: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|react-transition-group|react-is)[\\/]/,
          name: 'vendor-react',
        },
        muiVendor: {
          // This is crazy huge
          test: /[\\/]node_modules[\\/](@mui\/*)[\\/]/,
          name: 'vendor-mui',
        },
        emotionVendor: {
          test: /[\\/]node_modules[\\/](@emotion\/*)[\\/]/,
          name: 'vendor-emotion',
        },
        fontsourceVendor: {
          test: /[\\/]node_modules[\\/](@fontsource\/*)[\\/]/,
          name: 'vendor-fontsource',
        },
        apolloVendor: {
          test: /[\\/]node_modules[\\/](@apollo\/*)[\\/]/,
          name: 'vendor-apollo',
        },
        firebaseVendor: {
          test: /[\\/]node_modules[\\/](@firebase\/*|@firebase)[\\/]/,
          name: 'vendor-firebase',
        },
        remixRunRouterVendor: {
          test: /[\\/]node_modules[\\/](@remix-run\/*)[\\/]/,
          name: 'vendor-remixRunRouter',
        },
        graphqlVendor: {
          test: /[\\/]node_modules[\\/](graphql)[\\/]/,
          name: 'vendor-graphqlRouter',
        },
        vendorOther: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor-other',
        },
      },
    },
  },
  cache: {
    cacheDirectory: path.resolve(__dirname, '.cache'),
    type: 'filesystem',
  },
  devtool: false,
  devServer: {
    hot: 'only',
    historyApiFallback: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        pathRewrite: { '^/api': '' },
      },
    },
    client: {
      overlay: {
        errors: true,
        warnings: false, // todo - restore to true once GenerateSW errors are resolved
      },
    },
  },
  plugins: [
    new webpack.SourceMapDevToolPlugin({
      columns: true,
      filename: '[file].map',
      module: true,
      noSources: false,
    }),
    new HtmlPlugin({ template: './index.html', hash: true }),
    new webpack.ProvidePlugin({
      React: 'react',
    }),
    new DotenvPlugin({ systemvars: true }),
    IS_DEV && new ReactRefreshPlugin(),
    new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false }),
    new webpack.WatchIgnorePlugin({
      paths: [/\.js$/, /\.d\.[cm]ts$/],
    }),
    new CleanWebpackPlugin(), // https://github.com/webpack/webpack-dev-middleware/issues/861
    !IS_DEV &&
      new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.jsx?$|\.css$\.html$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
    new CopyPlugin({
      patterns: [
        { from: 'public/assets', to: 'assets' },
        { from: 'public/root', to: './' },
      ],
    }),
    new GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      clientsClaim: true,
      skipWaiting: true,
      maximumFileSizeToCacheInBytes: 12582912, // 12mb
    }), // This must remain last, also when we want push notifications we'll need to inject a custom sw
  ].filter(Boolean),
}
