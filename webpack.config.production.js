const webpack = require('webpack');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const BUILD_DIR = path.resolve(__dirname, 'public');
const APP_DIR = path.resolve(__dirname, 'client');
const LESS_DIR = path.resolve(__dirname, 'less');

const config = {
    mode: 'production',
    devtool: 'source-map',
    entry: [
        path.join(__dirname, 'client/index.jsx'),
        path.join(__dirname, 'client/tailwind.css'),
        LESS_DIR + '/site.less'
    ],
    output: {
        path: BUILD_DIR,
        filename: 'bundle.min.js',
        publicPath: '/'
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: false
                    }
                }
            })
        ],
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                    filename: 'vendors.min.js'
                }
            }
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
            '__BUILD_VERSION__': JSON.stringify(process.env.BUILD_VERSION || 'LOCAL')
        })
    ],
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.less$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            url: {
                                filter: (url) => !url.startsWith('/')
                            }
                        }
                    },
                    'less-loader'
                ]
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            url: {
                                filter: (url) => !url.startsWith('/')
                            }
                        }
                    },
                    'postcss-loader'
                ]
            },
            {
                test: /\.(png|woff|woff2|eot|ttf|svg)(\?.*)?$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 100 * 1024
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json']
    }
};

module.exports = config;
