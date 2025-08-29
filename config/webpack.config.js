const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    target: 'node',
    mode: isProduction ? 'production' : 'development',
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bumba.js',
      library: 'BUMBA',
      libraryTarget: 'commonjs2',
      clean: true
    },
    
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    node: '18'
                  }
                }]
              ]
            }
          }
        }
      ]
    },
    
    resolve: {
      extensions: ['.js'],
      alias: {
        '@core': path.resolve(__dirname, 'src/core'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@departments': path.resolve(__dirname, 'src/core/departments'),
        '@specialists': path.resolve(__dirname, 'src/core/specialists'),
        '@integration': path.resolve(__dirname, 'src/core/integration')
      }
    },
    
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: true,
              pure_funcs: isProduction ? ['console.log', 'console.debug'] : []
            },
            mangle: {
              keep_fnames: true,
              keep_classnames: true
            }
          }
        })
      ]
    },
    
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode),
        'BUMBA_VERSION': JSON.stringify(require('./package.json').version)
      }),
      
      new webpack.BannerPlugin({
        banner: `BUMBA CLI v${require('./package.json').version}
Build: ${new Date().toISOString()}
Mode: ${argv.mode}
(c) 2025 BUMBA Team`,
        raw: false
      })
    ],
    
    externals: {
      // Don't bundle these Node.js modules
      'fs': 'commonjs fs',
      'path': 'commonjs path',
      'os': 'commonjs os',
      'crypto': 'commonjs crypto',
      'child_process': 'commonjs child_process',
      'util': 'commonjs util',
      'events': 'commonjs events',
      'stream': 'commonjs stream',
      'http': 'commonjs http',
      'https': 'commonjs https',
      'url': 'commonjs url',
      'querystring': 'commonjs querystring',
      'zlib': 'commonjs zlib'
    },
    
    devtool: isProduction ? false : 'source-map',
    
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }
  };
};