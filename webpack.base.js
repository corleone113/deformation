const path = require('path');
const HTMLPlugin = require('html-webpack-plugin');
const {
	CleanWebpackPlugin
} = require('clean-webpack-plugin');
const {
	HotModuleReplacementPlugin
} = require('webpack');

module.exports = {
	entry: {
		main: './src/index.tsx',
	},
	output: {
		filename: '[name].js',
		path: path.join(__dirname, 'dist'),
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
		alias: {
			'@': path.join(__dirname, 'src'),
		},
	},
	module: {
		rules: [{
			test: /\.tsx?$/,
			exclude: /node_modules/,
			use: [{
				loader: 'babel-loader',
				options: {
					presets: [
						'@babel/preset-env',
						'@babel/preset-typescript',
						'@babel/preset-react',
					],
					plugins: [
						[
						  '@babel/plugin-transform-react-jsx',
						  {
						    runtime: 'automatic',
						  },
						],
						"@babel/plugin-proposal-class-properties",
						'@babel/plugin-transform-runtime',
					],
				},
			}, ],
		}, 
	{
		test: /\.(glsl|vs|fs)$/,
		exclude: /node_modules/,
		use: [
			'raw-loader',
			'glslify-loader'
		]
	}],
	},
	devServer: {
		port: 34461,
		hot: true,
		contentBase: __dirname,
		open: true,
	},
	plugins: [
		new CleanWebpackPlugin(),
		new HotModuleReplacementPlugin(),
		new HTMLPlugin({
			template: 'index.html',
			chunks: ['main'],
		}),
	],
};