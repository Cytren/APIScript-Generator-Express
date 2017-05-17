
import * as fs from "fs";
import * as shell from "shelljs";

import {WriteStream} from "fs";

export class TypescriptWriter {

    private closureIndex = 0;
    private indentation = '';

    private stream: WriteStream;

    public constructor(file: string) {
        shell.mkdir('-p', file.replace(/[a-zA-Z0-9-]+\.ts$/, ''));
        this.stream = fs.createWriteStream(file);
    }

    public openFunction(name?: string, doesExport = false, isDefault = false, args: [string, string][] = []) {

        if (doesExport) { this.write('export '); }
        if (isDefault) { this.write('default '); }

        this.write(`function `);
        if (name) { this.write(`${name} `); }
        this.write(`(`);

        args.forEach((argument, index) => {
            this.write(`${argument[0]}: ${argument[1]}`);
            if (index != args.length - 1) { this.write(', '); }
        });

        this.write(`) `);
        this.openClosure();
    }

    public openClosure(pre?: string) {
        if (pre) { this.write(pre); }
        this.write('{\n');

        this.closureIndex++;
        this.indentation += '    ';
    }

    public closeClosure(pre?: string) {
        this.closureIndex--;

        if (this.closureIndex < 0) {
            throw new Error('Too many closures have been closed');
        }

        this.indentation = this.indentation.substring(4, this.indentation.length);

        if (pre) { this.write(pre); }
        this.write('}\n');
    }

    public newLine(){
        this.write('\n');
    }

    public indent() {
        this.write(this.indentation);
    }

    public write(data: any) {
        if (this.stream == null) {
            throw new Error('Writer already closed');
        }

        this.stream.write(data);
    }

    public writeLine(data: any) {
        this.write(this.indentation + data + '\n');
    }

    public close() {
        this.stream.end();
        this.stream = null;
    }

}