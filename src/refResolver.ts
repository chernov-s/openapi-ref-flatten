import { Ref } from './ref';
import { Parser } from './v3/parse';
import { OpenAPI } from 'openapi-types';
import { resolve as pathResolver } from "url";
const get = require('lodash.get');

export type RefResolverOptions = {
    pathResolver?: (path: string) => string
}

export class RefResolver {

    constructor(private readonly openApi: OpenAPI.Document,
                private readonly rootPath: string,
                private readonly options: RefResolverOptions = {}) {
        this.schemas = get(this.openApi, 'components.schemas') || {};
        if (!this.options) {
            this.options = {
                pathResolver: (path) => path
            }
        }
    }

    public readonly schemas: { [key: string]: Object };
    public static modelCache = {};
    private models = new Set<string>();

    getSchemas() {
        const notFounds: string[] = [];
        Array.from(this.models).forEach(modelName => {
            if (!this.schemas[modelName]) {
                notFounds.push(modelName);
            }
        });
        if (notFounds.length > 0) {
            console.log('[MODAL IS NOT FOUND]', this.rootPath, notFounds);
        }
        return this.schemas;
    }

    public async resolve(obj: any, filePath: string): Promise<any> {
        if (Array.isArray(obj)) {
            return Promise.all(obj.map(async (item) => {
                return await this.resolve(item, filePath)
            }));
        }
        if (obj && typeof obj === 'object') {
            if (Ref.isRef(obj)) {
                return await this.resoleRef(obj, withoutHash(filePath, obj.$ref));
            }
            for (let key of Object.keys(obj)) {
                let value = obj[key];
                if (Ref.isRef(value)) {
                    if (Ref.isExternalRef(value)) {
                        obj[key] = await this.resoleRef(value, withoutHash(filePath, value.$ref));
                    } else if (filePath !== this.rootPath) {
                        const p = value && value['x-origin-$ref']
                            ? Ref.stripHash(value['x-origin-$ref'])
                            : filePath;
                        obj[key] = await this.resoleRef(value, p || filePath);
                    }
                } else {
                    obj[key] = await this.resolve(value, filePath);
                }
            }
        }
        return obj;
    }

    private async resoleRef(partialObj: any, filePath: string): Promise<any> {
        const originRef = filePath + Ref.getHash(partialObj.$ref);

        if (RefResolver.modelCache[originRef]) {
            return RefResolver.modelCache[originRef];
        }

        const modelName: string = Ref.getModelName(partialObj.$ref);
        const fileContent = await Parser.parse(this.options.pathResolver ? this.options.pathResolver(filePath) : filePath);
        const jsPath = Ref.getJsPath(Ref.getHash(partialObj.$ref));
        const model = RefResolver.modelCache[originRef] || get(fileContent, jsPath);

        if (!Ref.isRef(model) && model && ['boolean', 'string', 'integer'].indexOf(model.type) !== -1) {
            return {
                ...model,
                'x-origin-$ref': originRef
            };
        }

        if (!this.schemas[modelName]) {
            this.schemas[modelName] = await this.resolve(model, filePath);
            RefResolver.modelCache[modelName] = this.schemas[modelName];
        }
        if (RefResolver.modelCache[modelName] && !this.schemas[modelName]) {
            this.schemas[modelName] = RefResolver.modelCache[modelName];
        }
        return {
            $ref: `#/components/schemas/${modelName}`,
            'x-origin-$ref': originRef
        };
    }
}

function withoutHash(basePath: string, pathWithHash: string): string {
    return pathResolver(basePath, Ref.stripHash(pathWithHash));
}
