
import {API} from "apiscript";
import {TypescriptWriter} from "./typescript-writer";

import * as propertyWriter from "./property-writer";
import * as transform from "../util/text-transformers";

export function writeEntityClasses(api: API, libDir: string) {

    api.forEachEntity((entity) => {

        let name = entity.name;
        let fileName = transform.pascalToDash(name);
        let writer = new TypescriptWriter(`${libDir}/entity/${fileName}.ts`);

        console.log(`Generating entity ${entity.name}`);

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
    });
}