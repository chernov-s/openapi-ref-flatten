const jsonPointerSlash = /~1/g;
const jsonPointerTilde = /~0/g;

export class Ref {

    static isRef(value: {$ref?: string}): boolean {
        return value && typeof value === 'object' && typeof value.$ref === 'string' && value.$ref.length > 0;
    };

    static isExternalRef(obj: {$ref?: string}): boolean {
        return Ref.isRef(obj) && !!obj.$ref && obj.$ref[0] !== '#';
    }

    /**
     * foo/bar.json#path/Model => foo/bar.json
     */
    static stripHash(path: string): string {
        let hashIndex = path.indexOf("#");
        if (hashIndex >= 0) {
            path = path.substr(0, hashIndex);
        }
        return path;
    }

    /**
     * foo/bar.json#path/Model => path/Model
     */
    static getHash(path: string): string {
        let hashIndex = path.indexOf("#");
        if (hashIndex >= 0) {
            return path.substr(hashIndex);
        }
        return "#";
    }

    /**
     * foo/bar.json#path/Model => Model
     */
    static getModelName(path: string): string {
        if (!path) {
            return 'UNRESOLED';
        }
        const arr = path.split('/');
        return arr[arr.length - 1];
    }

    /**
     * foo/bar.json#path/Model => path.Model
     */
    static getJsPath(pointer: string): string {
        if (pointer.length <= 1 || pointer[0] !== "#" || pointer[1] !== "/") {
            return pointer;
        }

        return pointer
            .slice(2)
            .split("/")
            .map((value) => {
                return decodeURIComponent(value)
                    .replace(jsonPointerSlash, "/")
                    .replace(jsonPointerTilde, "~");
            }).join('.');
    }
}
