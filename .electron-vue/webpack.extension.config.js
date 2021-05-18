'use strict'

process.env.BABEL_ENV = 'worker'

const path = require('path')
const { dependencies } = require('../package.json')
const webpack = require('webpack')
const { execSync } = require('child_process')

// const MinifyPlugin = require("babel-minify-webpack-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
let whiteListedModules = ['vue']

function genExtensionConfig(extname) {
    let extensionConfig = {
        devtool: '#cheap-module-eval-source-map',
        entry: {
          extensions: path.join(__dirname, '../extensions/' + extname + '/index.ts')
        },
        externals: [
          ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d))
        ],
        module: {
          rules: [
            {
              test: /\.(js|vue)$/,
              enforce: 'pre',
              exclude: /node_modules/,
              use: {
                loader: 'eslint-loader',
                options: {
                  formatter: require('eslint-friendly-formatter')
                }
              }
            },
            {
              test: /\.scss$/,
              use: ['vue-style-loader', 'css-loader', 'sass-loader']
            },
            {
              test: /\.sass$/,
              use: ['vue-style-loader', 'css-loader', 'sass-loader?indentedSyntax']
            },
            {
              test: /\.less$/,
              use: ['vue-style-loader', 'css-loader', 'less-loader']
            },
            {
              test: /\.css$/,
              use: ['vue-style-loader', 'css-loader']
            },
            {
              test: /\.html$/,
              use: 'vue-html-loader'
            },
            {
              test: /\.js$/,
              use: 'babel-loader',
              exclude: /node_modules/
            },
            {
              test: /\.node$/,
              use: 'node-loader'
            },
            {
              test: /\.vue$/,
              use: {
                loader: 'vue-loader',
                options: {
                  extractCSS: process.env.NODE_ENV === 'production',
                  loaders: {
                    sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax=1',
                    scss: 'vue-style-loader!css-loader!sass-loader',
                    less: 'vue-style-loader!css-loader!less-loader'
                  }
                }
              }
            },
            {
              test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
              use: {
                loader: 'url-loader',
                query: {
                  limit: 10000,
                  name: 'imgs/[name]--[folder].[ext]'
                }
              }
            },
            {
              test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
              loader: 'url-loader',
              options: {
                limit: 10000,
                name: 'media/[name]--[folder].[ext]'
              }
            },
            {
              test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
              use: {
                loader: 'url-loader',
                query: {
                  limit: 10000,
                  name: 'fonts/[name]--[folder].[ext]'
                }
              }
            },
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
          new MiniCssExtractPlugin({filename: 'styles.css'}),
          new webpack.HotModuleReplacementPlugin(),
          new webpack.NoEmitOnErrorsPlugin()
        ],
        output: {
          filename: 'index.js',
          libraryTarget: 'commonjs2',
          path: path.join(__dirname, '../extensions-dist/' + extname)
        },
        resolve: {
          alias: {
            '@': path.join(__dirname, '../extensions/' + extname),
            'vue$': 'vue/dist/vue.esm.js'
          },
          extensions: ['.js', '.vue', '.json', '.css', '.node', '.ts', '.tsx']
        },
        target: 'node'
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
        new webpack.DefinePlugin({
            '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
        })
        )
    }
    return extensionConfig
}

function loadExtensions() {
    let extensionsConfig = []
    const fs = require('fs')
    const dirs = fs.readdirSync(path.join(__dirname, '../extensions'))
    let extDependencies = {}
    for (let extname of dirs) {
        if (extname === 'node_modules' || extname === 'package-lock.json') continue
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
    process.chdir(path.join(__dirname, '../extensions'))
    for (let name in extDependencies) {
        try {
            console.info(process.cwd() + ', install ' + name)
            execSync('npm install --prefix . ' + name + '@' + extDependencies[name])
        } catch(err) {
            console.error(err)
        }
    }
    process.chdir(__dirname)
    // copy dir
    let extModule = path.join(__dirname, '../extensions-dist')
    if (!fs.existsSync(extModule)) {
        execSync('mkdir ' + extModule)
    }
    execSync('cp -r ' + path.join(__dirname, '../extensions/node_modules') + ' ' + extModule + '/node_modules')
    return extensionsConfig
}

let extensionsConfig = loadExtensions()
module.exports = extensionsConfig
