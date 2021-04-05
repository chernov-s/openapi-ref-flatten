import { extname } from "path";
import { jsonFile } from './json-file';

export class Parser {

    private static cache = new Map<string, {}>();

    public static async parse(path: string): Promise<{}> {

        const res = this.cache.get(path);

        if (res !== undefined) {
            return res;
        }

        const extension = extname(path).toLowerCase();
        const content = await jsonFile(path);
        switch (extension) {
            case '.yml':
            case '.yaml':
                // TODO Use js-yaml
                throw new Error(`Unsupported OpenApi YAML: "${path}"`);

            default:
                try {
                    const result = JSON.parse(content);
                    this.cache.set(path, result);
                    return result;
                } catch (e) {
                    throw new Error(`Could not parse OpenApi JSON: "${path}"`);
                }
        }
    }
}

