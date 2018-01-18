// Karma configuration
// Generated on Tue Sep 05 2017 15:44:44 GMT-0400 (AST)

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            // 'node_modules/babel-polyfill/dist/polyfill.js',
            'tests/*.spec.js'
        ],

        // list of files to exclude
        exclude: [
        ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
       /*
        * pre-process matching files before serving them to the browser
        * Add your App entry point as well as your Tests files which should be
        * stored under the tests directory in your basePath also this expects
        * you to save your tests with a .spec.js file extension. This assumes we
        * are writing in ES6 and would run our file through babel before webpack.
        */
        preprocessors: {
            'src/scripts/index.js': ['babel', 'webpack', 'sourcemap'],
            'tests/*.spec.js': ['babel', 'webpack', 'sourcemap']
        },

        babelPreprocessor: {
            options: {
                presets: ['es2015', 'stage-2'],
                plugins: ['transform-es2015-modules-umd']
            }
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: [
            'ChromeHeadless'
            // 'PhantomJS'
        ],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,

        // Pass your webpack.config.js file's content
        webpack: {
            // karma watches the test entry points
            // (you don't need to specify the entry option)
            module: {
                loaders: [{
                    test: /\.js$/,
                    loader: 'babel-loader',
                    exclude: /node_modules/
                }, {
                    test: /\.vue$/,
                    loader: 'vue-loader',
                    options: {
                        loaders: {
                            scss: 'vue-style-loader!css-loader!sass-loader',
                            sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax'
                        }
                    }
                }, {
                    test: /\.s[a|c]ss$/,
                    loader: 'style!css!sass'
                }]
            },

            resolve: {
                modules: [
                    'node_modules',
                    'src/scripts'
                ]
            },

            // plugins: [
            //     new webpack.ProvidePlugin({
            //         jQuery: 'jquery',
            //         $: 'jquery',
            //         jquery: 'jquery',
            //     })
            // ],

            // externals: {
            //     // require('jquery') is external and available
            //     // on the global var jQuery
            //     'jquery': 'jQuery',
            //     'jquery': '$',
            //     'jquery': 'jquery'
            // },

            devtool: 'inline-source-map'
        },

        webpackMiddleware: {
            noInfo: true,
            stats: 'errors-only'
        }
    });
};

