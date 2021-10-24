"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var Path = __importStar(require("path"));
(0, index_1.pack)({
    plugin: Path.join(__dirname, '../test-plugin'),
    // 过滤插件的文件，相对于plugin目录的相对路径
    filterFiles: [
        'README.md',
        'readme.js' // 无效的文件
    ],
    unMinFiles: [
        'panel/index.js',
        'panel/item.js' // 不存在的文件
    ],
    // out: Path.join(__dirname, 'out'), // 默认的插件打包文件存放位置，默认在project/out
    show: true,
    cleanOut: true,
});
