"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pack = void 0;
var UglifyES = __importStar(require("uglify-es"));
var Fs = __importStar(require("fs"));
var FsExtra = __importStar(require("fs-extra"));
var Path = __importStar(require("path"));
// @ts-ignore
var HtmlMinifier = __importStar(require("html-minifier"));
// @ts-ignore
var globby = __importStar(require("globby"));
// @ts-ignore
var jszip_1 = __importDefault(require("jszip"));
var util_1 = require("./util");
var child_process = __importStar(require("child_process"));
var lodash_1 = require("lodash");
var PluginVersion2 = '2.x';
var PluginVersion3 = '3.x';
var CCPluginPacker = /** @class */ (function () {
    function CCPluginPacker() {
        this.unMinFiles = [];
        this.filterFiles = [];
        this.version = null;
        this.pluginDir = null;
        this.outDir = null;
        this.show = false;
        this.cleanOut = false;
        this._options = null;
    }
    CCPluginPacker.prototype._compressCode = function (jsFile, isMin) {
        if (Fs.existsSync(jsFile)) {
            var data = Fs.readFileSync(jsFile, 'utf-8');
            var drop_console = true;
            if (this._options && this._options['dropConsole'] == false) {
                drop_console = false;
            }
            var result = UglifyES.minify(data, {
                compress: {
                    dead_code: true,
                    drop_console: drop_console,
                    drop_debugger: true, //丢弃debugger代码,默认true
                },
                output: {
                // comments: false,
                }
            });
            if (result.error) {
                // console.log("❎压缩出现错误: " + result.error.message);
                // console.log("❎发生错误的文件: " + jsFile);
                return false;
            }
            else {
                if (isMin) {
                    var file = Path.basename(jsFile, Path.extname(jsFile));
                    file += '.min.js';
                    Fs.writeFileSync(file, result.code);
                }
                else {
                    Fs.writeFileSync(jsFile, result.code);
                }
                return true;
            }
        }
        else {
            console.log('文件不存在:' + jsFile);
            return false;
        }
    };
    CCPluginPacker.prototype._packageDir = function (rootPath, zip) {
        var dir = Fs.readdirSync(rootPath);
        for (var i = 0; i < dir.length; i++) {
            var itemDir = dir[i];
            var itemFullPath = Path.join(rootPath, itemDir);
            var stat = Fs.statSync(itemFullPath);
            if (stat.isFile()) {
                zip.file(itemDir, Fs.readFileSync(itemFullPath));
            }
            else if (stat.isDirectory()) {
                this._packageDir(itemFullPath, zip.folder(itemDir));
            }
        }
    };
    CCPluginPacker.prototype.initFilterFiles = function (options, pluginDir) {
        var filterFiles = [];
        if (options.filterFiles) {
            if (Array.isArray(options.filterFiles)) {
                filterFiles = options.filterFiles;
            }
            else {
                filterFiles = [options.filterFiles];
            }
        }
        var defaultFilterFiles = ['package-lock.json', 'README.md', '.idea', '.git', '.gitignore', '.vscode', '.eslintrc.js'];
        filterFiles = filterFiles.concat(defaultFilterFiles);
        filterFiles = (0, lodash_1.uniq)(filterFiles);
        var _loop_1 = function (i) {
            var item = filterFiles[i];
            var full = Path.join(pluginDir, item);
            if (Fs.existsSync(full)) {
                i++;
            }
            else {
                if (!defaultFilterFiles.find(function (el) { return el === item; })) {
                    console.warn('无效的过滤项: ' + item);
                }
                filterFiles.splice(i, 1);
            }
            out_i_1 = i;
        };
        var out_i_1;
        for (var i = 0; i < filterFiles.length;) {
            _loop_1(i);
            i = out_i_1;
        }
        return filterFiles;
    };
    CCPluginPacker.prototype.initUnMinFiles = function (options) {
        var unMinFiles = [];
        if (options.unMinFiles) {
            if (Array.isArray(options.unMinFiles)) {
                unMinFiles = options.unMinFiles;
            }
            else {
                unMinFiles = [options.unMinFiles];
            }
        }
        unMinFiles = (0, lodash_1.uniq)(unMinFiles);
        return unMinFiles;
    };
    CCPluginPacker.prototype.initOut = function (options, pluginDir) {
        var outDir = '';
        if (!options.out ||
            !Fs.existsSync(options.out) ||
            options.out.indexOf(pluginDir) > -1 // out目录不能是父子关系
        ) {
            outDir = Path.join(pluginDir, '../out');
            FsExtra.ensureDirSync(outDir);
        }
        else {
            outDir = options.out;
        }
        FsExtra.emptyDirSync(outDir);
        return outDir;
    };
    CCPluginPacker.prototype.pack = function (options) {
        this._options = options;
        var needNpmInstall = options.needNpmInstall;
        // 参数解析
        this.version = options.version || PluginVersion2;
        this.show = options.show;
        this.cleanOut = !!options.cleanOut;
        this.pluginDir = options.plugin || null;
        if (!this.pluginDir || !Fs.existsSync(this.pluginDir)) {
            console.error("[ERROR] \u63D2\u4EF6\u76EE\u5F55\u65E0\u6548: ".concat(options.plugin));
            return;
        }
        this.unMinFiles = this.initUnMinFiles(options);
        this.filterFiles = this.initFilterFiles(options, this.pluginDir);
        this.outDir = this.initOut(options, this.pluginDir);
        this.copySourceToPackDir(this.pluginDir, this.outDir, this.filterFiles);
        this.compressJs(this.outDir, this.unMinFiles);
        this.compressHTMLCSS(this.outDir, this.unMinFiles);
        var packageJsonFile = Path.join(this.outDir, 'package.json');
        this.modifyPackageJson(packageJsonFile, ['devDependencies', 'dev', "husky", "lint-staged", "scripts"]);
        if (needNpmInstall === undefined || needNpmInstall === true) {
            this.reNpmInstall(this.outDir); // npm install，会删除devDependencies的依赖
        }
        this.modifyPackageJson(packageJsonFile, ['dependencies']);
        var pluginName = Path.basename(this.pluginDir);
        this.zipDir(this.outDir, pluginName);
    };
    CCPluginPacker.prototype.removeFile = function (dir, files) {
        if (files === void 0) { files = []; }
        files.forEach(function (file) {
            var fullPath = Path.join(dir, file);
            if (Fs.existsSync(fullPath)) {
                Fs.unlinkSync(fullPath);
            }
        });
    };
    CCPluginPacker.prototype.reNpmInstall = function (dir) {
        console.log("\u2705[npm install] reInstall ...");
        var std = child_process.execSync('npm install', { cwd: dir });
        this.removeFile(dir, ['package-lock.json']);
    };
    CCPluginPacker.prototype.zipDir = function (dir, pluginName) {
        var _this = this;
        var zip = new jszip_1.default();
        this._packageDir(dir, zip.folder(pluginName));
        var dirParent = Path.dirname(dir);
        if (!Fs.existsSync(dirParent)) {
            dirParent = dir;
        }
        var zipFilePath = Path.join(dirParent, "".concat(pluginName, ".zip"));
        if (Fs.existsSync(zipFilePath)) {
            Fs.unlinkSync(zipFilePath);
            console.log('⚠[删除] 旧版本压缩包: ' + zipFilePath);
        }
        zip.generateNodeStream({
            type: 'nodebuffer',
            streamFiles: true,
            compression: 'DEFLATE',
            compressionOptions: {
                level: 9
            }
        })
            .pipe(Fs.createWriteStream(zipFilePath))
            .on('finish', function () {
            console.log('✅[打包]成功!');
            _this.show && (0, util_1.showFileInExplore)(zipFilePath);
            _this.cleanOut && FsExtra.removeSync(dir);
        })
            .on('error', function () {
            console.log('❌[打包]失败: ');
        });
    };
    CCPluginPacker.prototype.compressHTMLCSS = function (dir, unMinFiles) {
        if (unMinFiles === void 0) { unMinFiles = []; }
        var opts = [
            "".concat(dir, "/**/*.{html,css}"),
            "!".concat(dir, "/node_modules/**/*"),
        ];
        unMinFiles.forEach(function (item) {
            var ext = Path.extname(item);
            if (ext === '.html' || ext === '.css') {
                opts.push("!".concat(Path.join(dir, item)));
            }
        });
        var paths = globby.sync(opts);
        var minify = HtmlMinifier.minify;
        for (var i = 0; i < paths.length; i++) {
            var item = paths[i];
            var itemData = Fs.readFileSync(item, 'utf-8');
            var minifyData = minify(itemData, {
                removeComments: true,
                collapseWhitespace: true,
                minifyJS: false,
                minifyCSS: false, //是否压缩html里的css（使用clean-css进行的压缩）
            });
            Fs.writeFileSync(item, minifyData);
            console.log("\u2705[\u538B\u7F29] \u6210\u529F(HTML)[".concat(i + 1, "/").concat(paths.length, "]: ").concat(item));
        }
    };
    CCPluginPacker.prototype.compressJs = function (dir, unMinFiles) {
        if (unMinFiles === void 0) { unMinFiles = []; }
        var opts = [
            "".concat(dir, "/**/*.js"),
            "!".concat(dir, "/node_modules/**/*"),
        ];
        unMinFiles.forEach(function (item) {
            var ext = Path.extname(item);
            if (ext === '.js') {
                opts.push("!".concat(Path.join(dir, item)));
            }
        });
        var paths = globby.sync(opts);
        for (var i = 0; i < paths.length; i++) {
            var item = paths[i];
            var b = this._compressCode(item, false);
            if (b) {
                console.log("\u2705[\u538B\u7F29] \u6210\u529F(JS)[".concat(i + 1, "/").concat(paths.length, "]: ").concat(item));
            }
            else {
                console.log("\u274E[\u538B\u7F29] \u5931\u8D25(JS)[".concat(i + 1, "/").concat(paths.length, "]: ").concat(item));
            }
        }
    };
    CCPluginPacker.prototype.copySourceToPackDir = function (sourceDir, destDir, filterFiles) {
        if (filterFiles === void 0) { filterFiles = []; }
        var notCopyFileArray = [];
        filterFiles.forEach(function (item) {
            var fullUrl = Path.join(sourceDir, item);
            if (Fs.existsSync(fullUrl)) {
                notCopyFileArray.push(fullUrl);
            }
        });
        FsExtra.copySync(sourceDir, destDir, {
            // filter <Function>: Function to filter copied files. Return true to include, false to exclude.
            filter: function (file, dest) {
                var isInclude = true;
                var state = Fs.statSync(file);
                if (state.isDirectory()) {
                    // 文件夹,判断是否有这个文件夹
                    isInclude = !notCopyFileArray.find(function (itemFile) {
                        return Fs.statSync(itemFile).isDirectory() && itemFile === file;
                    });
                }
                else if (state.isFile()) {
                    // 文件 判断是否包含在文件夹内
                    for (var i = 0; i < notCopyFileArray.length; i++) {
                        var itemFile = notCopyFileArray[i];
                        if (Fs.statSync(itemFile).isDirectory()) {
                            if (file.indexOf(itemFile) === -1) {
                            }
                            else {
                                isInclude = false;
                                break;
                            }
                        }
                        else if (Fs.statSync(itemFile).isFile()) {
                            if (itemFile === file) {
                                isInclude = false;
                                break;
                            }
                        }
                    }
                }
                if (!isInclude) {
                    if (Fs.statSync(file).isFile()) {
                        console.log('⚠[过滤] 文件: ' + file);
                    }
                    else if (Fs.statSync(file).isDirectory()) {
                        console.log('⚠[过滤] 目录: ' + file);
                    }
                }
                return isInclude;
            }
        });
        filterFiles.forEach(function (item) {
            var fullUrl = Path.join(destDir, item);
            if (FsExtra.existsSync(fullUrl) &&
                Fs.statSync(fullUrl).isDirectory()) {
                FsExtra.removeSync(fullUrl);
            }
        });
        console.log('✅[拷贝] 拷贝插件到输出目录成功: ' + destDir);
    };
    CCPluginPacker.prototype.deleteKey = function (json, keys) {
        keys.forEach(function (key) {
            if (json.hasOwnProperty(key)) {
                delete json[key];
                console.log("\u2705[\u4E22\u5F03] \u65E0\u7528".concat(key));
            }
        });
    };
    CCPluginPacker.prototype.modifyPackageJson = function (jsonFilePath, deleteKeys) {
        if (!Fs.existsSync(jsonFilePath)) {
            return false;
        }
        var json;
        try {
            var cfgData = Fs.readFileSync(jsonFilePath, 'utf-8');
            json = JSON.parse(cfgData);
        }
        catch (e) {
            json = null;
        }
        if (!json) {
            return;
        }
        // 删除无用的menu
        var menus = null;
        if (this.version === PluginVersion2) {
            menus = json['main-menu'];
        }
        else if (this.version === PluginVersion3) {
            // todo 有待完善
        }
        if (menus) {
            for (var key in menus) {
                var item = menus[key];
                if (item && item.del) {
                    delete menus[key];
                    console.log('✅[丢弃] 无用menus: ' + key);
                }
            }
        }
        this.deleteKey(json, deleteKeys);
        Fs.writeFileSync(jsonFilePath, JSON.stringify(json));
        console.log('✅[修改] 写入新的临时配置package.json完毕!');
    };
    return CCPluginPacker;
}());
function pack(opts) {
    var packer = new CCPluginPacker();
    packer.pack(opts);
}
exports.pack = pack;
//# sourceMappingURL=index.js.map