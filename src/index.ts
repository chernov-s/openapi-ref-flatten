import { parse } from './v3/parse';
import { resolveFile } from './utils/resolve-file';

export type Options = {
    input: string;
    output: string;
}

export async function dereference({input, output}: Options): Promise<void> {
    console.log('[input]', input, output)
    const openApi = await parse(input);

    await resolveFile(openApi, output);
}
