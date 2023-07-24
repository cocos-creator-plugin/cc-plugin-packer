# 打包CocosCreator插件

- 压缩混淆js
- 压缩html,css
- 针对插件的package.json目录会自动做一些剔除工作

```
{
    "main-menu":{
        "menu1":{
            "del":true, // 删除该菜单
        }
    },
    "dependencies":{}, // 删除依赖
    "devDependencies":{}, // 删除依赖
}
```

使用示例

```js

const Path = require('path');
const { pack } = require('cc-plugin-packer');
pack({
    version: '3.x', // 插件版本：2.x / 3.x
    plugin: Path.join(__dirname, 'test-plugin'),
    // 过滤插件的文件，相对于plugin目录的相对路径
    filterFiles: [
        'README.md',
        'readme.js' // 无效的文件
    ],
    // 不压缩的JS代码
    unMinFiles: [
        'panel/index.js',
        'panel/item.js' // 不存在的文件
    ],
    needNpmInstall:true, // 是否需要 npm install，有些插件没有使用任何npm模块就不需要了
    // 默认的插件打包文件存放位置，默认和插件目录同级
    out: Path.join(__dirname, 'out'),
    // 打包完毕后是否在文件夹中显示 
    show: true,
    // 是否删除临时产生的打包目录
    cleanOut: true,
});

```
