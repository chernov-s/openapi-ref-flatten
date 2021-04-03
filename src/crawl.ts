import { Ref } from './ref';
import { Parser } from './v3/parse';
import * as _ from 'lodash';
import { OpenAPI } from 'openapi-types';
import { resolve as pathResolver } from "url";

type Schema = { [name: string]: object };
type RefObject = { $ref: string };

export class Crawler {

    constructor(private readonly openApi: OpenAPI.Document,
                private readonly rootPath: string) {
        this.schemas = _.get(openApi, 'components.schemas', {});
    }

    public readonly schemas: { [key: string]: Object };

    public async resolve(obj: any, filePath: string) {
        if (obj && typeof obj === 'object') {
            if (Ref.isExternalRef(obj)) {
                await this.resoleRef(obj, withoutHash(filePath, obj.$ref));
            } else {
                for (let key of Object.keys(obj)) {
                    let value = obj[key];
                    if (Ref.isRef(value)) {
                        if (Ref.isExternalRef(value)) {
                            await this.resoleRef(value, withoutHash(filePath, value.$ref));
                        } else if (filePath !== this.rootPath) {
                            await this.resoleRef(value, filePath);
                        }
                    } else {
                        obj[key] = await this.resolve(value, filePath);
                    }
                }
            }
        }
        return obj;
    }

    private async resoleRef(partialObj: any, filePath: string): Promise<void> {
        const fileContent = await Parser.parse(filePath);
        const modelName: string = Ref.getModelName(partialObj.$ref);
        const jsPath = Ref.getJsPath(Ref.getHash(partialObj.$ref));

        const model = _.get(fileContent, jsPath);
        partialObj.$ref = `#/components/schemas/${modelName}`;

        if (!this.schemas[modelName]) {
            console.log('[SCHEMAS]', filePath, modelName);
            this.schemas[modelName] = await this.resolve(model, filePath);
        }
    }
}

function withoutHash(basePath: string, pathWithHash: string): string {
    return pathResolver(basePath, Ref.stripHash(pathWithHash));
}
