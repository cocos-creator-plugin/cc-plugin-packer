interface PackOptions {
    filterFiles?: string[] | string;
    unMinFiles?: string[] | string;
    version?: string;
    out?: string;
    plugin: string;
    show: boolean;
    dropConsole?: boolean;
    needNpmInstall?: boolean;
    cleanOut?: boolean;
}
export declare function pack(opts: PackOptions): void;
export {};
