let packagePlugin = require('./index.js');
let Path = require('path');
packagePlugin(
    {
        project: __dirname,
        plugin: 'test-plugin',
        // 过滤插件的文件，相对于plugin目录的相对路径
        filterFiles: [
            ''
        ],
        dontMinJs: [
            ''
        ], // 不压缩的JS代码
        out: '', // 默认的插件打包文件存放位置，默认在project/out
    },
    'cocos-particle2d',

    [
        'engine/cocos2d-js-for-preview.js',
    ]);
