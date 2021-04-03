import { Parser } from './v3/parse';
import { resolveFile } from './utils/resolve-file';

import { Crawler } from './crawl';

export type Options = {
    input: string;
    output: string;
}

export async function dereference({input, output}: Options): Promise<void> {
    console.log('[input]', input, output)
    const openApi = await Parser.parse(input);

    const crawler = new Crawler(openApi, input);
    const result = {
        ...await crawler.resolve(openApi, input),
        components: {
            schemas: crawler.schemas
        }
    };

    await resolveFile(result, output);
}
