
import * as apiscript from 'apiscript';
import * as transform from '../util/text-transformers';
import * as propertyWriter from "./property-writer";

import {API} from "apiscript";
import {TypescriptWriter} from "./typescript-writer";

export function writeResponseClasses(api: API, libDir: string, mainWriter: TypescriptWriter) {

    api.forEachEndpoint((endpoint, index) => {
        let url = transform.urlToDash(endpoint.url);
        let fileName = `${url}-${apiscript.requestMethodToString(endpoint.requestMethod).toLowerCase()}`;

        mainWriter.writeLine(`import Request${index} from './response/${fileName}';`);
        let writer = new TypescriptWriter(`${libDir}/response/${fileName}.ts`);

        let returnType = endpoint.returnType;
        let inheritanceType: string;

        if (returnType == null) {
            inheritanceType = 'SuccessResponse';
        } else if (returnType.isPrimitive) {

            if (returnType.isInteger) { inheritanceType = 'IntegerResponse'; }
            if (returnType.isFloat) { inheritanceType = 'FloatResponse'; }
            if (returnType.isBoolean) { inheritanceType = 'BooleanResponse'; }
            if (returnType.isString) { inheritanceType = 'StringResponse'; }

        } else if (returnType.isEntity || returnType.isCollection) {
            let propertyTypes = propertyWriter.calculatePropertyTypeNames(returnType);

            propertyTypes.forEach((type) => {
                writer.writeLine(`import {${type}} from './entity/${transform.pascalToDash(type)}';`);
            });

            inheritanceType = 'BasicResponse';
        }

        writer.writeLine(`import {${inheritanceType}} from './response';`);
        writer.newLine();

        writer.write(`export class Response extends ${inheritanceType} `);
        writer.openClosure();

        if (returnType != null && (returnType.isEntity || returnType.isCollection)) {
            let returnString = propertyWriter.propertyTypeToString(returnType);
            let fieldName = returnType.isEntity ? transform.pascalToCamel(returnString) : 'values';

            writer.writeLine(`public value(${fieldName}: ${returnString}) { this.response = ${fieldName}; }`);
        }

        writer.closeClosure();
        writer.close();

    });

}