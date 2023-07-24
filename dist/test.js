"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var pluginDir = 'E:/proj/noise/noise/packages/noise';
// const pluginDir=Path.join(__dirname, '../test-plugin');
(0, index_1.pack)({
    plugin: pluginDir,
    // 过滤插件的文件，相对于plugin目录的相对路径
    filterFiles: [
        'README.md',
        'readme.js',
        'readme.md',
        'node_moduels/',
        'pack.js',
        'package-lock.json',
        'todo.txt',
    ],
    needNpmInstall: false,
    unMinFiles: [
        'panel/index.js',
        'panel/index.html',
        'panel/item.html',
        'panel/item.js',
        'main.js',
        'package.json',
        'scene-walker.js',
    ],
    // out: Path.join(__dirname, 'out'), // 默认的插件打包文件存放位置，默认在project/out
    show: true,
    cleanOut: true,
});
//# sourceMappingURL=test.js.map