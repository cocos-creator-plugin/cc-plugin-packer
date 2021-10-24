// 在文件夹中展示打包文件
import { exec } from 'child_process'
import * as OS from 'os'

export function showFileInExplore(showPath: string) {
    let platform = OS.platform();
    let cmd = null;
    if (platform === 'darwin') {
        cmd = 'open ' + showPath;
    } else if (platform === 'win32') {
        cmd = 'explorer ' + showPath;
    }
    if (cmd) {
        console.log('😂[CMD] ' + cmd);
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.log(stderr);
            } else {
                // console.log(stdout);
            }
        });
    }
}

