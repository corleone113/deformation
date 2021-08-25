const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.base');

module.exports = merge({ mode: process.env.NODE_ENV }, baseConfig);
