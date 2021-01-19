import { relative, resolve } from 'path';
import { OpenAPI } from 'openapi-types';
import { mkdir, rmdir, writeFile } from './file-system';

export async function resolveFile(
    openApi: OpenAPI.Document,
    output: string
): Promise<void> {
    const outputPath = resolve(process.cwd(), output);

    if (!isSubDirectory(process.cwd(), output)) {
        throw new Error(`Output folder is not a subdirectory of the current working directory`);
    }
    await rmdir(outputPath);
    await mkdir(outputPath);

    const file = resolve(outputPath, 'test.json');

    await writeFile(file, JSON.stringify(openApi, null, '  '));
}

export function isSubDirectory(parent: string, child: string) {
    return relative(child, parent).startsWith('..');
}
