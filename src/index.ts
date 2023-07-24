import * as UglifyES from 'uglify-es';
import * as Fs from 'fs'
import * as FsExtra from 'fs-extra'
import * as Path from 'path'
// @ts-ignore
import * as HtmlMinifier from 'html-minifier'
// @ts-ignore
import * as globby from 'globby'
// @ts-ignore
import JsZip from 'jszip'
import { showFileInExplore } from './util'
import { type } from 'os';
import * as child_process from 'child_process';
import { uniq } from 'lodash'

const PluginVersion2 = '2.x';
const PluginVersion3 = '3.x';

interface PackOptions {
    filterFiles?: string[] | string,
    unMinFiles?: string[] | string,
    version?: string, // 插件的creator版本
    out?: string,// 插件输出目录，默认插件目录的同级
    plugin: string,// 插件的目录
    show: boolean;
    needNpmInstall?: boolean;// 是否需要 npm install，有些插件没有使用任何npm模块就不需要了
    cleanOut?: boolean; // 是否清理out目录
}

class CCPluginPacker {
    _compressCode(jsFile: string, isMin: boolean) {
        if (Fs.existsSync(jsFile)) {
            let data = Fs.readFileSync(jsFile, 'utf-8');
            let result = UglifyES.minify(data, {
                compress: {
                    dead_code: true,// 移除未使用的code
                    drop_console: true,//丢弃console代码,默认false
                    drop_debugger: true,//丢弃debugger代码,默认true
                },
                output: {
                    // comments: false,
                }
            });
            if (result.error) {
                // console.log("❎压缩出现错误: " + result.error.message);
                // console.log("❎发生错误的文件: " + jsFile);
                return false;
            } else {
                if (isMin) {
                    let file = Path.basename(jsFile, Path.extname(jsFile))
                    file += '.min.js';
                    Fs.writeFileSync(file, result.code);
                } else {
                    Fs.writeFileSync(jsFile, result.code);
                }
                return true;
            }
        } else {
            console.log('文件不存在:' + jsFile);
            return false;
        }
    }

    _packageDir(rootPath: string, zip: any) {
        let dir = Fs.readdirSync(rootPath);
        for (let i = 0; i < dir.length; i++) {
            let itemDir = dir[i];
            let itemFullPath = Path.join(rootPath, itemDir);
            let stat = Fs.statSync(itemFullPath);
            if (stat.isFile()) {
                zip.file(itemDir, Fs.readFileSync(itemFullPath));
            } else if (stat.isDirectory()) {
                this._packageDir(itemFullPath, zip.folder(itemDir));
            }
        }
    }

    private unMinFiles: string[] = [];
    private filterFiles: string[] = [];
    private version: string | null = null;
    private pluginDir: string | null = null;
    private outDir: string | null = null;
    private show: boolean = false;
    private cleanOut: boolean = false;

    private initFilterFiles(options: PackOptions, pluginDir: string) {
        let filterFiles: string[] = [];
        if (options.filterFiles) {
            if (Array.isArray(options.filterFiles)) {
                filterFiles = options.filterFiles;
            } else {
                filterFiles = [options.filterFiles]
            }
        }
        const defaultFilterFiles = ['package-lock.json', 'README.md', '.idea', '.git', '.gitignore', '.vscode', '.eslintrc.js']
        filterFiles = filterFiles.concat(defaultFilterFiles)
        filterFiles = uniq(filterFiles);
        for (let i = 0; i < filterFiles.length;) {
            let item = filterFiles[i];
            let full = Path.join(pluginDir, item);
            if (Fs.existsSync(full)) {
                i++;
            } else {
                if (!defaultFilterFiles.find(el => el === item)) {
                    console.warn('无效的过滤项: ' + item);
                }
                filterFiles.splice(i, 1);
            }
        }
        return filterFiles;
    }

    private initUnMinFiles(options: PackOptions) {
        let unMinFiles: string[] = [];
        if (options.unMinFiles) {
            if (Array.isArray(options.unMinFiles)) {
                unMinFiles = options.unMinFiles;
            } else {
                unMinFiles = [options.unMinFiles];
            }
        }
        unMinFiles = uniq(unMinFiles);
        return unMinFiles;
    }

    private initOut(options: PackOptions, pluginDir: string) {
        let outDir: string = '';
        if (!options.out ||
            !Fs.existsSync(options.out) ||
            options.out.indexOf(pluginDir) > -1// out目录不能是父子关系
        ) {
            outDir = Path.join(pluginDir, '../out');
            FsExtra.ensureDirSync(outDir);
        } else {
            outDir = options.out;
        }
        FsExtra.emptyDirSync(outDir);
        return outDir;
    }

    pack(options: PackOptions) {
        const { needNpmInstall } = options;

        // 参数解析
        this.version = options.version || PluginVersion2;
        this.show = options.show;
        this.cleanOut = !!options.cleanOut;
        this.pluginDir = options.plugin || null;
        if (!this.pluginDir || !Fs.existsSync(this.pluginDir)) {
            console.error(`[ERROR] 插件目录无效: ${options.plugin}`)
            return;
        }

        this.unMinFiles = this.initUnMinFiles(options)
        this.filterFiles = this.initFilterFiles(options, this.pluginDir)
        this.outDir = this.initOut(options, this.pluginDir)
        this.copySourceToPackDir(this.pluginDir, this.outDir, this.filterFiles);
        this.compressJs(this.outDir, this.unMinFiles);
        this.compressHTMLCSS(this.outDir, this.unMinFiles);

        const packageJsonFile = Path.join(this.outDir, 'package.json');
        this.modifyPackageJson(packageJsonFile, ['devDependencies', 'dev', "husky", "lint-staged", "scripts"]);

        if (needNpmInstall === undefined || needNpmInstall === true) {
            this.reNpmInstall(this.outDir);// npm install，会删除devDependencies的依赖
        }
        this.modifyPackageJson(packageJsonFile, ['dependencies'])
        const pluginName = Path.basename(this.pluginDir);
        this.zipDir(this.outDir, pluginName);
    }

    private removeFile(dir: string, files: string[] = []) {
        files.forEach(file => {
            let fullPath = Path.join(dir, file)
            if (Fs.existsSync(fullPath)) {
                Fs.unlinkSync(fullPath)
            }
        })
    }

    private reNpmInstall(dir: string) {
        console.log(`✅[npm install] reInstall ...`)
        const std: Buffer = child_process.execSync('npm install', { cwd: dir })
        this.removeFile(dir, ['package-lock.json'])
    }

    private zipDir(dir: string, pluginName: string) {
        let zip = new JsZip();
        this._packageDir(dir, zip.folder(pluginName))
        let dirParent = Path.dirname(dir);
        if (!Fs.existsSync(dirParent)) {
            dirParent = dir;
        }
        const zipFilePath = Path.join(dirParent, `${pluginName}.zip`)
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
            .on('finish', () => {
                console.log('✅[打包]成功!');
                this.show && showFileInExplore(zipFilePath);
                this.cleanOut && FsExtra.removeSync(dir);
            })
            .on('error', () => {
                console.log('❌[打包]失败: ');
            });
    }

    private compressHTMLCSS(dir: string, unMinFiles: string[] = []) {
        let opts = [
            `${dir}/**/*.{html,css}`,
            `!${dir}/node_modules/**/*`,
        ]
        unMinFiles.forEach(item => {
            const ext = Path.extname(item)
            if (ext === '.html' || ext === '.css') {
                opts.push(`!${Path.join(dir, item)}`)
            }
        })

        let paths = globby.sync(opts);
        let minify = HtmlMinifier.minify;
        for (let i = 0; i < paths.length; i++) {
            let item = paths[i];
            let itemData = Fs.readFileSync(item, 'utf-8');
            let minifyData = minify(itemData, {
                removeComments: true,// 是否去掉注释
                collapseWhitespace: true,// 是否去掉空格
                minifyJS: false, //是否压缩html里的js（使用uglify-js进行的压缩）
                minifyCSS: false,//是否压缩html里的css（使用clean-css进行的压缩）
            });
            Fs.writeFileSync(item, minifyData);
            console.log(`✅[压缩] 成功(HTML)[${i + 1}/${paths.length}]: ${item}`);
        }
    }

    private compressJs(dir: string, unMinFiles: string[] = []) {
        let opts = [
            `${dir}/**/*.js`,
            `!${dir}/node_modules/**/*`,
        ];
        unMinFiles.forEach(item => {
            const ext = Path.extname(item)
            if (ext === '.js') {
                opts.push(`!${Path.join(dir, item)}`)
            }
        })
        const paths = globby.sync(opts);
        for (let i = 0; i < paths.length; i++) {
            let item = paths[i];
            let b = this._compressCode(item, false);
            if (b) {
                console.log(`✅[压缩] 成功(JS)[${i + 1}/${paths.length}]: ${item}`);
            } else {
                console.log(`❎[压缩] 失败(JS)[${i + 1}/${paths.length}]: ${item}`);
            }
        }
    }

    private copySourceToPackDir(sourceDir: string, destDir: string, filterFiles: string[] = []) {
        let notCopyFileArray: string[] = [];
        filterFiles.forEach(item => {
            const fullUrl = Path.join(sourceDir, item);
            if (Fs.existsSync(fullUrl)) {
                notCopyFileArray.push(fullUrl)
            }
        })

        FsExtra.copySync(sourceDir, destDir, {
            // filter <Function>: Function to filter copied files. Return true to include, false to exclude.
            filter: (file: string, dest: string) => {
                let isInclude = true;
                let state = Fs.statSync(file);
                if (state.isDirectory()) {
                    // 文件夹,判断是否有这个文件夹
                    isInclude = !notCopyFileArray.find(itemFile => {
                        return Fs.statSync(itemFile).isDirectory() && itemFile === file
                    })
                } else if (state.isFile()) {
                    // 文件 判断是否包含在文件夹内
                    for (let i = 0; i < notCopyFileArray.length; i++) {
                        let itemFile = notCopyFileArray[i];
                        if (Fs.statSync(itemFile).isDirectory()) {
                            if (file.indexOf(itemFile) === -1) {
                            } else {
                                isInclude = false;
                                break;
                            }
                        } else if (Fs.statSync(itemFile).isFile()) {
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
                    } else if (Fs.statSync(file).isDirectory()) {
                        console.log('⚠[过滤] 目录: ' + file);
                    }
                }
                return isInclude;
            }
        }
        )
        filterFiles.forEach(item => {
            const fullUrl = Path.join(destDir, item);
            if (FsExtra.existsSync(fullUrl) &&
                Fs.statSync(fullUrl).isDirectory()) {
                FsExtra.removeSync(fullUrl);
            }
        })
        console.log('✅[拷贝] 拷贝插件到输出目录成功: ' + destDir);
    }

    private deleteKey(json: any, keys: string[]) {
        keys.forEach(key => {
            if (json.hasOwnProperty(key)) {
                delete json[key];
                console.log(`✅[丢弃] 无用${key}`)
            }
        })
    }

    modifyPackageJson(jsonFilePath: string, deleteKeys: string[]) {
        if (!Fs.existsSync(jsonFilePath)) {
            return false;
        }
        let json;
        try {
            let cfgData = Fs.readFileSync(jsonFilePath, 'utf-8');
            json = JSON.parse(cfgData);
        } catch (e) {
            json = null;
        }
        if (!json) {
            return;
        }
        // 删除无用的menu
        let menus = null;
        if (this.version === PluginVersion2) {
            menus = json['main-menu'];
        } else if (this.version === PluginVersion3) {
            // todo 有待完善
        }
        if (menus) {
            for (let key in menus) {
                let item = menus[key];
                if (item && item.del) {
                    delete menus[key];
                    console.log('✅[丢弃] 无用menus: ' + key);
                }
            }
        }
        this.deleteKey(json, deleteKeys)
        Fs.writeFileSync(jsonFilePath, JSON.stringify(json));
        console.log('✅[修改] 写入新的临时配置package.json完毕!');
    }
}

export function pack(opts: PackOptions) {
    const packer = new CCPluginPacker();
    packer.pack(opts)
}
