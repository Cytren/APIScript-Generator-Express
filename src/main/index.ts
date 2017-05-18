
import * as fs from 'fs';
import * as del from 'del';
import * as apiset from "apiset";
import * as transform from "./util/text-transformers";
import * as propertyWriter from "./writer/property-writer";

import {TypescriptWriter} from "./writer/typescript-writer";
import {writeRequestClasses} from "./writer/request-writer";

export class ExpressGenerator implements apiset.Generator {

    generate(api: apiset.API, config: apiset.Config) {

        // get the build dirs from config if available
        let buildDir = config.buildDir ? config.buildDir : 'build';
        let libDir = buildDir + '/' + (config.libDir ? config.libDir : 'apiset');
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

        api.forEachEntity((entity) => {
            let name = entity.name;
            let fileName = transform.pascalToDash(name);
            let writer = new TypescriptWriter(`${libDir}/entity/${fileName}.ts`);

            console.log(`Generating entity ${entity.name}`);

            writer.newLine();
            propertyWriter.writePropertyImports(writer, entity);
            writer.newLine();

            if (entity.inherits) {
                writer.writeLine(`import {${entity.inherits}} from './${fileName}'`);
                writer.newLine();
                writer.write(`export class ${name} extends ${entity.inherits} `);
            } else {
                writer.write(`export class ${name} `);
            }

            writer.openClosure();

            entity.forEachProperty((property) => {
                propertyWriter.writeProperty(writer, property);
            });

            writer.closeClosure();
            writer.close();
        });

        let writer = new TypescriptWriter(`${libDir}/apiset.ts`);

        writer.newLine();
        writer.writeLine('import {Express, Router} from "express";');
        writer.writeLine('import * as bodyParser from "body-parser";');
        writer.newLine();

        api.forEachEndpoint((endpoint, index) => {
            let url = transform.urlToDash(endpoint.url);

            writer.writeLine(`import endpoint${index} from '../api/${url}-` +
                `${apiset.requestMethodToString(endpoint.requestMethod).toLowerCase()}';`);
        });
        writer.newLine();

        writeRequestClasses(api, libDir, writer);
        writer.newLine();

        api.forEachEndpoint((endpoint, index) => {
            let url = transform.urlToDash(endpoint.url);

            writer.writeLine(`import Response${index} from './response/${url}-` +
                `${apiset.requestMethodToString(endpoint.requestMethod).toLowerCase()}';`);
        });
        writer.newLine();

        writer.openFunction(null, true, true, [['app', 'Express']]);
        writer.writeLine(`let router = new Router();`);
        writer.newLine();

        writer.writeLine(`router.use('/', (request, router) => { response.json({ error: 'Invalid API Endpoint' }); });`);
        writer.newLine();

        writer.writeLine(`app.use(bodyParser.json());`);
        writer.writeLine(`app.use('/${api.name}', router);`);

        writer.closeClosure();
        writer.close();

        console.log();
        console.log('Generation complete!');

    }
}

let instance = new ExpressGenerator();
module.exports = instance;