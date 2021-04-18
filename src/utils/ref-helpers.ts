import * as path from 'path';
import { safeAny } from '../types';

const jsonPointerSlash = /~1/g;
const jsonPointerTilde = /~0/g;

export class RefHelpers {

    public static isRef(value: {$ref?: string}): boolean {
        return value && typeof value === 'object' && typeof value.$ref === 'string' && value.$ref.length > 0;
    };

    public static isExternalRef(obj: {$ref?: string}): boolean {
        return RefHelpers.isRef(obj) && !!obj.$ref && obj.$ref[0] !== '#';
    }

    /**
     * foo/bar.json#path/Model => foo/bar.json
     */
    public static stripHash(path: string): string {
        let hashIndex = path.indexOf("#");
        if (hashIndex >= 0) {
            path = path.substr(0, hashIndex);
        }
        return path;
    }

    /**
     * foo/bar.json#path/Model => path/Model
     */
    public static getHash(path: string): string {
        let hashIndex = path.indexOf("#");
        if (hashIndex >= 0) {
            return path.substr(hashIndex);
        }
        return "#";
    }

    /**
     * foo/bar.json#path/Model => Model
     */
    public static getModelName(path: string): string {
        if (!path) {
            return 'UNRESOLVED';
        }
        const arr = path.split('/');
        return arr[arr.length - 1];
    }

    /**
     * foo/bar.json#path/Model => path.Model
     */
    public static getJsPath(pointer: string): string {
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

    public static withoutHash(basePath: string, pathWithHash: string): string {
        const pathWithoutHash = RefHelpers.stripHash(pathWithHash);
        if (!pathWithoutHash) {
            return basePath;
        }
        const dirname = path.dirname(basePath);
        return path.resolve(dirname, pathWithoutHash);
    }

    public static getOriginRef(obj: safeAny): string {
        if (RefHelpers.isRef(obj)) {
            return obj['x-origin-$ref'] || obj['$ref'];
        }
        return '';
    }

    public static withoutRef(obj: Record<string, safeAny>): Record<string, safeAny> {
        const clone = {...obj};
        if (clone.$ref) {
            delete clone.$ref;
        }
        return clone;
    }

    public static isFlattenable(model: safeAny): boolean {
        if (!model || RefHelpers.isRef(model)) {
            return false;
        }
        if (model.type === 'array') {
            return this.isFlattenable(model.items);
        }
        return ['boolean', 'string', 'integer'].indexOf(model.type) !== -1;
    }
}
