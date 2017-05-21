
import * as fs from "fs";
import * as apiscript from "apiscript";
import * as transform from "../util/text-transformers";

import {API} from "apiscript";
import {TypescriptWriter} from "./typescript-writer";

export function writeEndpointClasses(api: API, libDir: string, apiDir: string, mainWriter: TypescriptWriter) {

    api.forEachEndpoint((endpoint, index) => {

        let url = transform.urlToDash(endpoint.url);
        let fileName = `${url}-${apiscript.requestMethodToString(endpoint.requestMethod).toLowerCase()}`;

        mainWriter.write(`import endpoint${index} from '../api/${fileName};`);
        mainWriter.newLine();

        // only generate if this endpoint doesn't already exist
        if (fs.existsSync(`${apiDir}/${fileName}.ts`)) { return; }

        console.log(`Generating endpoint ${apiscript.requestMethodToString(endpoint.requestMethod).toUpperCase()} ${endpoint.url}`);

        let writer = new TypescriptWriter(`${apiDir}/${fileName}.ts`);
        writer.newLine();

        writer.write(`import {Request} from '../apiscript/request/${fileName}';`);
        writer.newLine();

        writer.write(`import {Response} from '../apiscript/response/${fileName}';`);
        writer.newLine(2);

        writer.write('export default function handle (request: Request, response: Response) ');
        writer.openClosure();
        writer.newLine();

        writer.indent();
        writer.write(`response.error('The endpoint has not been implemented yet.');`);
        writer.newLine();

        writer.subIndent();
        writer.closeClosure();
        writer.close();
    })

}