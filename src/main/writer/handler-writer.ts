
import * as apiscript from 'apiscript';
import * as transform from '../util/text-transformers';
import * as propertyUtil from '../util/property-util';

import {API, PropertyType, ListPropertyType, SetPropertyType, MapPropertyType} from "apiscript";
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

        // add imports for return type
        if (endpoint.returnType) {
            let importTypes = propertyUtil.calculatePropertyTypeNames(endpoint.returnType);

            importTypes.forEach((type) => {
                writer.write(`import {parse${type}} from './${transform.pascalToDash(type)}';`);
                writer.newLine();
            });

            if (importTypes.size > 0) { writer.newLine(); }
        }

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
            writer.write(`request.parameter.${property.name} = expressRequest.query.${property.name};`);
            writer.newLine();
        });
        writer.newLine();

        if (endpoint.returnType) {
            let type = endpoint.returnType;
            writer.indent();

            `try {
                req.body = parse_account(request.body);
            } catch (e) {
                res.error(e.message);
            }`;

            writer.write(`try `);
            writer.openClosure();
            writer.newLine();

            writer.indent();
            writer.write(`expressRequest.body = `);

            if (type.isPrimitive) {
                writer.write(`express.body`);
            } else if (type.isEntity) {
                writer.write(`parse${type}(express.body)`);
            } else if (type.isCollection) {
                writeParseEntity(type, writer);
                writer.write(`(express.body)`);
            }

            writer.write(`;`);
            writer.newLine();

            writer.subIndent();
            writer.closeClosure();
            writer.write(` catch (e) `);
            writer.openClosure();

            writer.newLine();
            writer.indent();
            writer.write(`response.error(e.message);`);
            writer.newLine();

            writer.subIndent();
            writer.closeClosure();
            writer.newLine(2);
        }

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