import { extname } from "path";
import { jsonFile } from './parser/json-file';
import { OpenAPIV3 } from 'openapi-types';

export async function parse(input: string): Promise<OpenAPIV3.Document> {
    const extension = extname(input).toLowerCase();
    const content = await jsonFile(input);
    switch (extension) {
        case '.yml':
        case '.yaml':
            // TODO Use js-yaml
            throw new Error(`Unsupported OpenApi YAML: "${input}"`);

        default:
            try {
                return JSON.parse(content);
            } catch (e) {
                throw new Error(`Could not parse OpenApi JSON: "${input}"`);
            }
    }
}
