
import {API, Entity} from "apiscript";
import {TypescriptWriter} from "./typescript-writer";

import * as propertyWriter from "./property-writer";
import * as transform from "../util/text-transformers";

export function writeEntityClasses(api: API, libDir: string) {

    api.forEachEntity((entity) => {

        let name = entity.name;
        let fileName = transform.pascalToDash(name);

        console.log(`Generating entity ${entity.name}`);

        writeEntityClass(entity, libDir, name, fileName);
        writeParseClass(entity, libDir, name, fileName);
    });
}

function writeEntityClass(entity: Entity, libDir: string, name: string, fileName: string) {

    let writer = new TypescriptWriter(`${libDir}/entity/${fileName}.ts`);
    writer.newLine();

    let importCount = propertyWriter.writePropertyImports(writer, entity);
    if (importCount > 0) { writer.newLine(); }

    if (entity.inherits) {
        writer.write(`import {${entity.inherits}} from './${transform.pascalToDash(entity.inherits)}';`);
        writer.newLine(2);
        writer.write(`export class ${name} extends ${entity.inherits} `);
    } else {
        writer.write(`export class ${name} `);
    }

    writer.openClosure();
    writer.newLine();

    entity.forEachProperty((property) => {
        propertyWriter.writeProperty(writer, property);
    });

    writer.closeClosure();
    writer.close();
}

function writeParseClass(entity: Entity, libDir: string, name: string, fileName: string) {

    let writer = new TypescriptWriter(`${libDir}/parse/${fileName}.ts`);
    writer.newLine();

    let fieldName = transform.pascalToCamel(name);

    writer.write(`import ${name} from '../entity/${fileName}';`);
    writer.newLine(2);

    writer.write(`export default function parse (body: any): Account `);
    writer.openClosure();
    writer.newLine();

    writer.indent();
    writer.write(`let ${fileName} = new ${name}();`);
    writer.newLine(2);

    entity.forEachProperty((property) => {
        writer.indent();
        writer.write(`${fileName}.${property.name} = body.${property.name};`);
        writer.newLine();
    });
    writer.newLine();

    entity.forEachProperty((property) => {
        if (!property.isOptional && !property.defaultValue) {

            writer.indent();
            writer.write(`if (!${fieldName}.${property.name}) { throw new Error('${name}.${property.name} is missing'); }`);
            writer.newLine();
        }
    });
    writer.newLine();

    writer.indent();
    writer.write(`return ${fieldName};`);
    writer.newLine();

    writer.subIndent();
    writer.closeClosure();
    writer.close();
}