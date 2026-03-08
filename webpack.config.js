const webpack = require('webpack');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, 'public');
const APP_DIR = path.resolve(__dirname, 'client');
const LESS_DIR = path.resolve(__dirname, 'less');

const config = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: [
        'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=2000',
        path.join(__dirname, 'client/index.jsx'),
        path.join(__dirname, 'client/tailwind.css'),
        LESS_DIR + '/site.less'
    ],
    output: {
        path: BUILD_DIR,
        filename: 'bundle.js',
        publicPath: '/'
    },
    devServer: {
        hot: true,
        static: BUILD_DIR
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
            '__DEV__': JSON.stringify('true'),
            '__BUILD_VERSION__': JSON.stringify('LOCAL')
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
