
import * as apiset from "apiset";
import * as transform from "./text-transformers";
import {TypescriptWriter} from "./typescript-writer";

function calculatePropertyTypeNames(propertyType: apiset.PropertyType, types = new Set<string>()): Set<string> {

    if (propertyType.isEntity) {
        let name = propertyTypeToString(propertyType);
        types.add(name);

    } else if (propertyType.isCollection) {

        if (propertyType.isList) {
            let list = propertyType as apiset.ListPropertyType;
            calculatePropertyTypeNames(list.type, types);

        } else if (propertyType.isSet) {
            let set = propertyType as apiset.SetPropertyType;
            calculatePropertyTypeNames(set.type, types);

        } else if (propertyType.isMap) {
            let map = propertyType as apiset.MapPropertyType;
            calculatePropertyTypeNames(map.keyType);
            calculatePropertyTypeNames(map.valueType);
        }
    }

    return types;
}

export function writePropertyImports(writer: TypescriptWriter, propertyHolder: apiset.Entity | apiset.Endpoint) {
    let importTypes = new Set<string>();

    propertyHolder.forEachProperty((property) => {
        let typeNames = calculatePropertyTypeNames(property.type);

        typeNames.forEach((value) => {
            importTypes.add(value);
        });
    });

    importTypes.forEach((importType) => {
        writer.writeLine(`import {${importType}} from './${transform.pascalToDash(importType)}';`);
    });
}

export function writeProperty(writer: TypescriptWriter, property: apiset.Property) {
    writer.indent();

    writer.write(`public ${property.name}`);
    if (property.isOptional) { writer.write('?'); }
    writer.write(`: ${propertyTypeToString(property.type)}`);

    if (property.type.isCollection || property.defaultValue) {
        writer.write(` = ${propertyToInstantiationString(property)}`);
    }

    writer.write(`;`);
    writer.newLine();
}

function propertyTypeToString(propertyType: apiset.PropertyType): string {

    if (propertyType.isPrimitive) {

        if (propertyType.isInteger || propertyType.isFloat) {
            return "number";
        } else if (propertyType.isBoolean) {
            return "boolean";
        } else if (propertyType.isString) {
            return "string";
        }

    } else if (propertyType.isCollection) {

        if (propertyType.isList) {
            let list = propertyType as apiset.ListPropertyType;
            return `${propertyTypeToString(list.type)}[]`;
        } else if (propertyType.isSet) {
            let set = propertyType as apiset.SetPropertyType;
            let type = propertyTypeToString(set.type);

            return `Set<${type}>`;
        } else if (propertyType.isMap) {
            let map = propertyType as apiset.MapPropertyType;
            let keyType = propertyTypeToString(map.keyType);
            let valueType = propertyTypeToString(map.valueType);

            return `Map<${keyType}, ${valueType}>`;
        }

    } else {
        return propertyType.toString();
    }
}

function propertyToInstantiationString(property: apiset.Property): string {
    let propertyType = property.type;

    if (propertyType.isPrimitive) {

        if (propertyType.isInteger || propertyType.isFloat) {
            return property.defaultValue;
        } else if (propertyType.isBoolean) {
            return property.defaultValue;
        } else if (propertyType.isString) {
            return `"${property.defaultValue}"`;
        }

    } else if (propertyType.isCollection) {

        if (propertyType.isList) {
            return `[]`;
        } else if (propertyType.isSet) {
            let set = propertyType as apiset.SetPropertyType;
            let type = propertyTypeToString(set.type);

            return `new Set<${type}>()`;
        } else if (propertyType.isMap) {
            let map = propertyType as apiset.MapPropertyType;
            let keyType = propertyTypeToString(map.keyType);
            let valueType = propertyTypeToString(map.valueType);

            return `new Map<${keyType}, ${valueType}>()`;
        }

    } else {
        return propertyType.toString();
    }

}