import { Parser } from './v3/parse';
import { RefResolver } from './refResolver';
import { resolveFile } from './utils/resolve-file';

export type Options = {
    input: string;
    output: string;
}

export async function dereference({input, output}: Options) {
    const openApi = await Parser.parse(input);

    const crawler = new RefResolver(openApi, input);
    const result = {
        ...await crawler.resolve(openApi, input),
        components: {
            schemas: crawler.schemas
        }
    };

    await resolveFile(result, output, 'test.json');
}
