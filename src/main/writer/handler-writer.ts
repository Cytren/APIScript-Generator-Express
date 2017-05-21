
import * as apiscript from 'apiscript';
import * as transform from '../util/text-transformers';

import {API, Entity, PropertyType, ListPropertyType, SetPropertyType, MapPropertyType} from "apiscript";
import {TypescriptWriter} from "./typescript-writer";

export function writeHandlerClasses(api: API, libDir: string, mainWriter: TypescriptWriter) {

    api.forEachEndpoint((endpoint) => {
        let url = transform.urlToDash(endpoint.url);
        let fileName = `${url}-${apiscript.requestMethodToString(endpoint.requestMethod).toLowerCase()}`;
        let method = apiscript.requestMethodToString(endpoint.requestMethod).toLowerCase();

        mainWriter.indent();
        mainWriter.write(`router.${method}('/${endpoint.url}', ${transform.urlToCamel(endpoint.url)});`);
        mainWriter.newLine();

        let writer = new TypescriptWriter(`${libDir}/handler/${fileName}.ts`);
        writer.newLine();

        writer.write(`import {parsePrimitive, parseList, parseSet, parseMap} from '../util/parse-util';`);
        writer.newLine();

        writer.write(`import {Request as ExpressRequest, Response as ExpressResponse} from "express";`);
        writer.newLine(2);

        writer.write(`import Request from "../request/${fileName}";`);
        writer.newLine();

        writer.write(`import Response from "../response/${fileName}";`);
        writer.newLine();

        writer.write(`import endpoint from "../api/${fileName}";`);
        writer.newLine(2);

        writer.write(`export default function handle(expressRequest: ExpressRequest, expressResponse: ExpressResponse) `);
        writer.openClosure();
        writer.newLine();

        writer.indent();
        writer.write(`let request = new Request();`);
        writer.newLine();

        writer.indent();
        writer.write(`let response = new Response();`);
        writer.newLine(2);

        endpoint.forEachProperty((property) => {
            if (!property.isOptional && !property.defaultValue) {

                writer.indent();
                writer.write(`if (!response.hasResponse && !expressRequest.query.${property.name}) { response.error('${property.name} is missing'); }`);
                writer.newLine();
            }
        });
        writer.newLine();

        endpoint.forEachProperty((property) => {
            writer.indent();
            let type = property.type;

            if (type.isEntity || type.isCollection) {

                if (type.isEntity) {
                    writer.write(`request.parameter.${property.name} = parse${type}(expressRequest.query.${property.name});`);
                } else if (type.isCollection) {

                    writer.write(`request.parameter.${property.name} = `);
                    writeParseEntity(type, writer);
                    writer.write(`(expressRequest.query.${property.name});`);
                }

            } else {
                writer.write(`request.parameter.${property.name} = expressRequest.query.${property.name};`);
            }

            writer.newLine();
        });
        writer.newLine();

        writer.indent();
        writer.write(`if (!response.hasResponse) { endpoint(request, response); }`);
        writer.newLine();

        writer.subIndent();
        writer.closeClosure();
        writer.close();
    });

}

function writeParseEntity(type: PropertyType, writer: TypescriptWriter) {

    if (type.isEntity) {
        writer.write(`parse${type}`);
    } else if (type.isCollection) {

        if (type.isList) {
            let list = type as ListPropertyType;

            writer.write('parseList(');
            writeParseEntity(list.type, writer);
            writer.write(')');

        } else if (type.isSet) {
            let set = type as SetPropertyType;

            writer.write('parseSet(');
            writeParseEntity(set.type, writer);
            writer.write(')');

        } else if (type.isMap) {
            let map = type as MapPropertyType;

            writer.write('parseMap(');
            writeParseEntity(map.keyType, writer);
            writer.write(', ');
            writeParseEntity(map.valueType, writer);
            writer.write(')');
        }

    } else if (type.isPrimitive) {
        writer.write(`parsePrimitive`);
    }
}