
import * as fs from 'fs';
import * as del from 'del';
import * as apiscript from "apiscript";
import * as transform from "./util/text-transformers";
import * as propertyWriter from "./writer/property-writer";

import {TypescriptWriter} from "./writer/typescript-writer";
import {writeRequestClasses} from "./writer/request-writer";
import {writeResponseClasses} from "./writer/response-writer";
import {writeEntityClasses} from "./writer/entity-writer";

export class ExpressGenerator implements apiscript.Generator {

    generate(api: apiscript.API, config: apiscript.Config) {

        // get the build dirs from config if available
        let buildDir = config.buildDir ? config.buildDir : 'build';
        let libDir = buildDir + '/' + (config.libDir ? config.libDir : 'apiscript');
        let apiDir = buildDir + '/' + (config.apiDir ? config.apiDir : 'api');

        // remove old lib directory
        if (fs.existsSync(libDir)) { del.sync(libDir); }

        api.forEachEnum((enumerator) => {
            let name = enumerator.name;
            let fileName = transform.pascalToDash(name);
            let writer = new TypescriptWriter(`${libDir}/entity/${fileName}.ts`);

            console.log(`Generating enum ${enumerator.name}`);

            writer.newLine();
            writer.write(`export const enum ${name} `);
            writer.openClosure();
            writer.newLine();

            let enumCount = enumerator.valueCount;

            enumerator.forEachValue((value, index) => {
                writer.indent();
                writer.write(value);

                if (index < enumCount - 1) {
                    writer.write(',');
                }

                writer.newLine();
            });

            writer.closeClosure();
            writer.close();
        });

        writeEntityClasses(api, libDir);

        let writer = new TypescriptWriter(`${libDir}/apiscript.ts`);
        writer.newLine();

        writer.write('import {Express, Router} from "express";');
        writer.newLine();

        writer.write('import * as bodyParser from "body-parser";');
        writer.newLine(2);

        api.forEachEndpoint((endpoint, index) => {
            let url = transform.urlToDash(endpoint.url);

            writer.write(`import endpoint${index} from '../api/${url}-` +
                `${apiscript.requestMethodToString(endpoint.requestMethod).toLowerCase()}';`);

            writer.newLine();
        });
        writer.newLine();

        writeRequestClasses(api, libDir, writer);
        writer.newLine();

        writeResponseClasses(api, libDir, writer);
        writer.newLine();

        writer.write(`export default function (app: express) `);
        writer.openClosure();
        writer.newLine();

        writer.indent();
        writer.write(`let router = new Router();`);
        writer.newLine(2);

        writer.indent();
        writer.write(`router.use('/', (request, router) => `);
        writer.openClosure();
        writer.newLine();

        writer.indent();
        writer.write(`response.json({ error: 'Invalid API Endpoint' });`);
        writer.newLine();

        writer.subIndent();
        writer.closeClosure();
        writer.write(`);`);
        writer.newLine(2);

        writer.indent();
        writer.write(`app.use(bodyParser.json());`);
        writer.newLine(1);

        writer.indent();
        writer.write(`app.use('/${api.name}', router);`);
        writer.newLine(1);

        writer.closeClosure();
        writer.close();

        console.log();
        console.log('Generation complete!');
    }
}

let instance = new ExpressGenerator();
module.exports = instance;