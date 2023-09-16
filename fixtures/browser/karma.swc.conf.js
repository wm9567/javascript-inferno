const path = require('path');
const gzipPreprocessor = require('./gzip/gzippreprocessor');
const resolve = (pkg) => path.join(__dirname, '../../packages', pkg, 'dist', 'index.dev.esm.js');
const useInfernoCompatPkg = process.env.InfernoCompat === '1';

console.info('*** Starting karma tests, Inferno-compat is ' + (useInfernoCompatPkg ? 'on.' : 'off.') + ' ***');

const preProcessorOptions = {};

if (useInfernoCompatPkg) {
  preProcessorOptions['./fixtures/browser/test.index.js'] = ['webpack', 'gzip'];
} else {
  preProcessorOptions['./fixtures/browser/test.no-compat.index.js'] = ['webpack', 'gzip'];
}

module.exports = function (config) {
  config.set({
    basePath: '../../',

    frameworks: ['detectBrowsers', 'jasmine'],

    detectBrowsers: {
      usePhantomJS: false,
      preferHeadless: false,

      postDetection(browserList) {
        const results = [];

        if (browserList.indexOf('Chrome') > -1) {
          results.push('Chrome');
        }

        if (browserList.indexOf('Firefox') > -1) {
          results.push('Firefox');
        }

        if (browserList.indexOf('Edge') > -1) {
          results.push('Edge');
        }

        return results;
      }
    },

    files: [path.join(__dirname, '../../fixtures/browser/', useInfernoCompatPkg ? 'test.index.js' : 'test.no-compat.index.js')],

    preprocessors: preProcessorOptions,

    plugins: ['karma-detect-browsers', 'karma-jasmine', 'karma-firefox-launcher', 'karma-webpack', gzipPreprocessor, 'karma-chrome-launcher'],

    reporters: ['dots'],

    reportSlowerThan: 500,

    browserConsoleLogOptions: {
      level: 'warn',
      terminal: false
    },
    colors: true,
    autoWatch: false,
    concurrency: 1,

    client: {
      jasmine: {
        random: false // Adding jasmine.random false disables test random order
      },
      captureConsole: false,
      logLevel: config.LOG_ERROR
    },

    webpack: {
      devtool: false,
      mode: 'none',
      optimization: {
        splitChunks: false,
        runtimeChunk: false,
        minimize: false
      },
      target: ['web'],
      module: {
        rules: [
          {
            test: /\.(ts|tsx|js|jsx)$/,
            exclude: /(node_modules)/,
            use: {
              // `.swcrc` can be used to configure swc
              loader: 'swc-loader',
              options: {
                "jsc": {
                  "parser": {
                    "syntax": "typescript",
                    "tsx": true,
                  },
                  "experimental": {
                    "plugins": [
                      ["swc-plugin-inferno", {}]
                    ],
                  },
                  "target": "es2022",
                  "loose": true,
                  "transform": {
                    "optimizer": {
                      "globals": {
                        "vars": {
                          "__DEBUG__": "true"
                        }
                      }
                    }
                  }
                }
              }
            },
          }
        ]
      },
      resolve: {
        alias: {
          inferno: resolve('inferno'),
          'inferno-animation': resolve('inferno-animation'),
          'inferno-compat': resolve('inferno-compat'),
          'inferno-create-element': resolve('inferno-create-element'),
          'inferno-hydrate': resolve('inferno-hydrate'),
          'inferno-extras': resolve('inferno-extras'),
          'inferno-hyperscript': resolve('inferno-hyperscript'),
          'inferno-mobx': resolve('inferno-mobx'),
          'inferno-redux': resolve('inferno-redux'),
          'inferno-router': resolve('inferno-router'),
          'inferno-server': resolve('inferno-server'),
          'inferno-shared': resolve('inferno-shared'),
          'inferno-test-utils': resolve('inferno-test-utils'),
          'inferno-utils': path.join(__dirname, '../../packages', 'inferno-utils', 'src', 'index.ts'),
          'inferno-vnode-flags': resolve('inferno-vnode-flags'),
          'inferno-clone-vnode': resolve('inferno-clone-vnode'),
          mobx: path.join(__dirname, '../../node_modules/mobx/dist/mobx.esm.js')
        },
        extensions: ['.js', '.jsx', '.tsx', '.ts'],
        mainFields: ['browser', 'main']
      },
      stats: 'normal',
      performance: {
        hints: false
      }
    }
  });
};
