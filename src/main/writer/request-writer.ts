
import * as apiscript from 'apiscript';
import * as transform from '../util/text-transformers';
import * as propertyWriter from "./property-writer";

import {API} from "apiscript";
import {TypescriptWriter} from "./typescript-writer";

export function writeRequestClasses(api: API, libDir: string, mainWriter: TypescriptWriter) {

    api.forEachEndpoint((endpoint, index) => {
        let url = transform.urlToDash(endpoint.url);
        let fileName = `${url}-${apiscript.requestMethodToString(endpoint.requestMethod).toLowerCase()}`;

        mainWriter.write(`import Request${index} from './request/${fileName}';`);
        mainWriter.newLine();

        let writer = new TypescriptWriter(`${libDir}/request/${fileName}.ts`);
        writer.newLine();

        let importCount = propertyWriter.writePropertyImports(writer, endpoint);
        if (importCount > 0) { writer.newLine(); }

        writer.write('export class Request ');
        writer.openClosure();
        writer.newLine();

        writer.indent();
        writer.write('public parameter = new Parameters();');
        writer.newLine();

        if (endpoint.requestType) {
            writer.indent();
            writer.write(`public body: ${propertyWriter.propertyTypeToString(endpoint.requestType)};`);
            writer.newLine();
        }
        writer.closeClosure();
        writer.newLine(2);

        writer.write('export class Parameters ');
        writer.openClosure();
        writer.newLine();

        endpoint.forEachProperty((property) => {
            propertyWriter.writeProperty(writer, property);
        });

        writer.closeClosure();
        writer.newLine();

        writer.close();
    });

}