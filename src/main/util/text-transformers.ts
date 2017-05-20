
function isUpperCase(value: string): boolean {
    return value.toUpperCase() === value;
}

function isLowerCase(value: string): boolean {
    return !isUpperCase(value);
}

export function urlToDash(name: string) {
    return name.replace(/\//g, '-');
}

export function urlToUnderscore(name: string) {
    return name.replace(/\//g, '_');
}

function pascalTransform(value: string, transform: string): string {
    let result = "";
    let wasLastCharacterLower = false;

    for (let i = 0; i < value.length; i++) {
        let character = value.charAt(i);
        let isCharacterLower = isLowerCase(character);

        if (wasLastCharacterLower && !isCharacterLower) {
            if (i != value.length - 1) { result += transform; }
        }

        result += character.toLowerCase();
        wasLastCharacterLower = isCharacterLower;
    }

    return result;
}

export function pascalToDash(value: string): string {
    return pascalTransform(value, '-');
}

export function pascalToUnderscore(value: string): string {
    return pascalTransform(value, '_');
}

export function pascalToCamel(value: string): string {
    if (value.length > 0) { return value.substring(0, 1).toLowerCase() + value.substring(1); }
    return value;
}