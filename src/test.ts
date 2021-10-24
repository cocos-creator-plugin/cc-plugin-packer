import pack from './index'
import * as Path from 'path'

pack({
    plugin: Path.join(__dirname, '../test-plugin'),
    // 过滤插件的文件，相对于plugin目录的相对路径
    filterFiles: [
        'README.md',
        'readme.js' // 无效的文件
    ],
    unMinFiles: [
        'panel/index.js',
        'panel/item.js' // 不存在的文件
    ], // 不压缩的JS代码
    // out: Path.join(__dirname, 'out'), // 默认的插件打包文件存放位置，默认在project/out
    show: true,
    cleanOut: true,
})
