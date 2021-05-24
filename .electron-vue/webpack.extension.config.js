'use strict'

process.env.BABEL_ENV = 'worker'

const path = require('path')
const fs = require('fs')
// const { dependencies } = require('../package.json')
const webpack = require('webpack')
const { execSync } = require('child_process')

// const MinifyPlugin = require("babel-minify-webpack-plugin")
const TerserPlugin = require("terser-webpack-plugin")
// const CopyWebpackPlugin = require('copy-webpack-plugin')
// const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// const { VueLoaderPlugin } = require('vue-loader')

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
// let whiteListedModules = ['vue']

function genExtensionConfig(extname) {
  let extensionConfig =  {
    // context: path.join(__dirname, '..'),
    devtool: '#cheap-module-eval-source-map',
    entry: {
      renderer: path.join(__dirname, '../extensions/' + extname + '/index.ts')
    },
    mode: 'development',
    externals: [
      // ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d))
    ],
    module: {
      rules: [
        // {
        //   test: /\.js$/,
        //   // 直接指明 loader 的绝对路径
        //   use: path.resolve(__dirname, '../.electron-vue/extension')
        // },
        // {
        //   test: /\.js$/,
        //   use: 'babel-loader',
        //   exclude: /node_modules/
        // },
        // {
        //   test: /\.node$/,
        //   loader: 'node-loader',
        //   options: {
        //     name(resourcePath, resourceQuery) {
        //       const resource = path.parse(resourcePath)
        //       // console.info('node loader: ', resourcePath, resourceQuery, resource.name)
        //       return resource.name + resource.ext
        //     }
        //   }
        // },
        {
          test: /\.(tsx|ts)(\?.*)?$/,
          use: {
            loader: 'ts-loader'
          },
          exclude: /node_modules/
        }
      ]
    },
    node: {
      __dirname: process.env.NODE_ENV !== 'production',
      __filename: process.env.NODE_ENV !== 'production'
    },
    plugins: [
      // new VueLoaderPlugin(),
      // new HtmlWebpackPlugin({
      //   chunks: ['renderer', 'vendor'],
      //   minify: {
      //     collapseWhitespace: true,
      //     removeAttributeQuotes: true,
      //     removeComments: true
      //   },
      //   templateParameters(compilation, assets, options) {
      //     return {
      //       compilation: compilation,
      //       webpack: compilation.getStats().toJson(),
      //       webpackConfig: compilation.options,
      //       htmlWebpackPlugin: {
      //         files: assets,
      //         options: options
      //       },
      //       process,
      //     };
      //   }
      // }),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin()
    ],
    output: {
      filename: 'index.js',
      libraryTarget: 'commonjs2',
      path: path.join(__dirname, '../extensions/' + extname)
    },
    resolve: {
      // alias: {
      //   sharp: path.join(__dirname, '../node_modules/sharp'),
      // },
      extensions: ['.js', '.ts', '.tsx']
    },
    target: 'electron-main'
  }
    /**
     * 发版打开此处
     */
    if (process.env.NODE_ENV === 'production') {
      extensionConfig.devtool = ''
  
      extensionConfig.plugins.push(
        new TerserPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
      )
    } else {
      extensionConfig.plugins.push(
        new TerserPlugin(),
        new webpack.LoaderOptionsPlugin({
          minimize: true
      })
      )
    }
    return extensionConfig
}

function loadExtensions() {
    let extensionsConfig = []
    const dirs = fs.readdirSync(path.join(__dirname, '../extensions'))
    let extDependencies = {}
    for (let extname of dirs) {
        if (extname === 'node_modules' || extname === 'package-lock.json' || extname === '.DS_Store') continue
        let config = genExtensionConfig(extname)
        extensionsConfig.push(config)
        let stream = fs.readFileSync(path.join(__dirname, '../extensions/' + extname + '/package.json'))
        let deps = JSON.parse(stream)['dependencies']
        if (deps !== undefined) {
            for (let name in deps) {
                extDependencies[name] = deps[name]
            }
        }
    }
    // install and copy node_modules to extension-dist
    let nodeModulesPath = '.'
    if (process.env.NODE_ENV === 'production') {
      nodeModulesPath = '.'
    }
    process.chdir(path.join(__dirname, '../extensions'))
    for (let name in extDependencies) {
        try {
            console.info(process.cwd() + ', install ' + name)
            execSync('npm install --prefix . ' + name + '@' + extDependencies[name])
        } catch(err) {
            console.error(err)
        }
    }
    // copy dir
    if (process.env.NODE_ENV !== 'production') {
      buildDev()
    } else {
      buildProd()
    }
    process.chdir(__dirname)
    return extensionsConfig
}

function buildDev() {
  const os = require('os')
  const platform = os.platform()
  if (platform === 'win32') {
    execSync('xcopy ' + '..\\extensions\\node_modules' + ' ' + '..\\node_modules\\ /s /e /y')
  } else {
    execSync('cp -r ' + path.join(__dirname, '../extensions/node_modules') + ' ' +path.join(__dirname, '../node_modules'))
  }
}

function buildProd() {
  let extModule = path.join(__dirname, '../extensions-dist')
  if (!fs.existsSync(extModule)) {
      execSync('mkdir ' + extModule)
  }
  const os = require('os')
  const platform = os.platform()
  if (platform === 'win32') {
    execSync('xcopy ' + '..\\extensions\\node_modules' + ' ' + '..\\extensions-dist\\node_modules\\ /s /e /y')
  } else {
    execSync('cp -r ' + path.join(__dirname, '../extensions/node_modules') + ' ' + extModule + '/node_modules')
  }
}

let extensionsConfig = loadExtensions('color_parser')
module.exports = extensionsConfig
