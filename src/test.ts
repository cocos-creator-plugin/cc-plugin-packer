import { pack } from './index'
import * as Path from 'path'
const pluginDir = 'E:/proj/noise/noise/packages/noise';
// const pluginDir=Path.join(__dirname, '../test-plugin');
pack({
    plugin: pluginDir,
    // 过滤插件的文件，相对于plugin目录的相对路径
    filterFiles: [
        'README.md',
        'readme.js', // 无效的文件
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
        'panel/item.js',// 不存在的文件
        'main.js',
        'package.json',
        'scene-walker.js',
    ], // 不压缩的JS代码
    // out: Path.join(__dirname, 'out'), // 默认的插件打包文件存放位置，默认在project/out
    show: true,
    cleanOut: true,
})
