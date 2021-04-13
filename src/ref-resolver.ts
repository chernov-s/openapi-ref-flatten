import { RefResolverOptions, safeAny } from './types';
import { RefHelpers } from './utils/ref-helpers';
import { Parser } from './read/parse';
const get = require('lodash.get');

export class RefResolver {

    constructor(private readonly openApi: safeAny,
                private readonly rootPath: string,
                private readonly options: RefResolverOptions = {}) {
        this.schemas = get(this.openApi, 'components.schemas') || {};
        if (!this.options) {
            this.options = {
                pathResolver: (path) => path
            }
        }
    }

    public static modelCache: {[key: string]: safeAny} = {};

    private readonly schemas: { [key: string]: safeAny };
    private readonly models = new Set<string>();

    public getSchemas(): { [key: string]: Object } {
        const notFounds: string[] = [];
        Array.from(this.models).forEach(modelName => {
            if (!this.schemas[modelName]) {
                notFounds.push(modelName);
            }
        });
        if (notFounds.length > 0) {
            console.log('[MODEL IS NOT FOUND]', this.rootPath, notFounds);
        }
        return this.schemas;
    }

    public async resolve(obj: safeAny, filePath: string): Promise<safeAny> {
        if (Array.isArray(obj)) {
            return Promise.all(obj.map(async (item) => {
                return await this.resolve(item, filePath)
            }));
        }

        if (RefHelpers.isRef(obj)) {
            return await this.resoleRef(obj, RefHelpers.withoutHash(filePath, RefHelpers.getOriginRef(obj)));
        }

        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        for (let key of Object.keys(obj)) {
            let value = obj[key];
            if (RefHelpers.isRef(value)) {
                const $ref = RefHelpers.getOriginRef(value);
                if (RefHelpers.isExternalRef(value)) {
                    obj[key] = await this.resoleRef(value, RefHelpers.withoutHash(filePath, $ref));
                } else if (filePath !== this.rootPath) {
                    const p = $ref
                        ? RefHelpers.stripHash($ref)
                        : filePath;
                    obj[key] = await this.resoleRef(value, p || filePath);
                }
            } else {
                obj[key] = await this.resolve(value, filePath);
            }
        }
        return obj;
    }

    private async resoleRef(partialObj: any, filePath: string): Promise<safeAny> {
        const originRef = filePath + RefHelpers.getHash(partialObj.$ref);
        const modelName: string = RefHelpers.getModelName(partialObj.$ref);
        const fileContent = await Parser.parse(this.options.pathResolver ? this.options.pathResolver(filePath) : filePath);
        const jsPath = RefHelpers.getJsPath(RefHelpers.getHash(partialObj.$ref));
        const model = RefResolver.modelCache[originRef] || get(fileContent, jsPath);

        if (!RefHelpers.isRef(model) && model && ['boolean', 'string', 'integer'].indexOf(model.type) !== -1) {
            const res = {
                ...RefHelpers.withoutRef(partialObj),
                ...model,
                'x-origin-$ref': originRef
            };
            RefResolver.modelCache[originRef] = res;
            return res;
        }

        this.models.add(modelName);
        if (!this.schemas[modelName]) {
            const res = {
                ...RefHelpers.withoutRef(partialObj),
                ...await this.resolve(model, filePath),
            };
            this.schemas[modelName] = res;
            RefResolver.modelCache[originRef] = res;
        }
        if (RefResolver.modelCache[originRef] && !this.schemas[modelName]) {
            this.schemas[modelName] = RefResolver.modelCache[originRef];
        }
        return {
            $ref: `#/components/schemas/${modelName}`,
            'x-origin-$ref': originRef
        };
    }
}
