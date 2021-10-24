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
exports.showFileInExplore = void 0;
// 在文件夹中展示打包文件
var child_process_1 = require("child_process");
var OS = __importStar(require("os"));
function showFileInExplore(showPath) {
    var platform = OS.platform();
    var cmd = null;
    if (platform === 'darwin') {
        cmd = 'open ' + showPath;
    }
    else if (platform === 'win32') {
        cmd = 'explorer ' + showPath;
    }
    if (cmd) {
        console.log('😂[CMD] ' + cmd);
        (0, child_process_1.exec)(cmd, function (error, stdout, stderr) {
            if (error) {
                console.log(stderr);
            }
            else {
                // console.log(stdout);
            }
        });
    }
}
exports.showFileInExplore = showFileInExplore;
