
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

export function pascalToDash(value: string): string {
    let result = "";
    let wasLastCharacterLower = false;

    for (let i = 0; i < value.length; i++) {
        let character = value.charAt(i);
        let isCharacterLower = isLowerCase(character);

        if (wasLastCharacterLower && !isCharacterLower) {
            if (i != value.length - 1) { result += "-"; }
        }

        result += character.toLowerCase();
        wasLastCharacterLower = isCharacterLower;
    }

    return result;
}