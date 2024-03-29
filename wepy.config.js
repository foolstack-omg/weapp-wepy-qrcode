const path = require('path');
var prod = process.env.NODE_ENV === 'production';

module.exports = {
    wpyExt: '.wpy',
    eslint: false,
    cliLogs: !prod,
    build: {},
    resolve: {
        alias: {
            counter: path.join(__dirname, 'src/components/counter'),
            '@': path.join(__dirname, 'src')
        },
        aliasFields: ['wepy', 'weapp'],
        modules: ['node_modules']
    },
    compilers: {
        less: {
            compress: prod
        },
        /*sass: {
          outputStyle: 'compressed'
        },*/
        babel: {
            sourceMap: true,
            presets: [
                'env'
            ],
            plugins: [
                'transform-class-properties',
                'transform-decorators-legacy',
                'transform-object-rest-spread',
                'transform-export-extensions',
            ]
        }
    },
    plugins: {
        replace: [
            {
                filter: /\.js$/,
                config: {
                    find: /__BASE_URL__/g,
                    replace: prod ? "'https://weapp-laravel-template.ergou.live/api'" : "'http://weapp-laravel-template.test/api'"
                }
            },
            {
                filter: /\.wxml$/,
                config: {
                    find: /__HTTP__/g,
                    replace: prod ? "https://weapp-laravel-template.ergou.live" : "http://weapp-laravel-template.test.test"
                }
            }
        ]
    },
    appConfig: {
        noPromiseAPI: ['createSelectorQuery']
    }
}

if (prod) {

    // 压缩sass
    // module.exports.compilers['sass'] = {outputStyle: 'compressed'}

    // 压缩js
    module.exports.plugins = {
        uglifyjs: {
            filter: /\.js$/,
            config: {}
        },
        imagemin: {
            filter: /\.(jpg|png|jpeg)$/,
            config: {
                jpg: {
                    quality: 80
                },
                png: {
                    quality: 80
                }
            }
        },
        replace: [
            {
                filter: /\.js$/,
                config: {
                    find: /__BASE_URL__/g,
                    replace: prod ? "'https://weapp-wepy-template.ergou.live/api'" : "'http://weapp-wepy-template.test/api'"
                }
            },
            {
                filter: /\.wxml$/,
                config: {
                    find: /__HTTP__/g,
                    replace: prod ? "https://weapp-wepy-template.ergou.live" : "http://weapp-wepy-template.test"
                }
            }
        ]
    }
}
