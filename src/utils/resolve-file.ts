import { relative, resolve } from 'path';
import { OpenAPI } from 'openapi-types';
import { mkdir, rmdir, writeFile } from './file-system';

export async function resolveFile(
    openApi: OpenAPI.Document,
    dir: string,
    fileName: string
): Promise<void> {
    const outputPath = resolve(process.cwd(), dir);

    if (!isSubDirectory(process.cwd(), dir)) {
        throw new Error(`Output folder is not a subdirectory of the current working directory`);
    }
    await rmdir(outputPath);
    await mkdir(outputPath);

    const file = resolve(outputPath, fileName);

    await writeFile(file, JSON.stringify(openApi, null, '  '));
}

export function isSubDirectory(parent: string, child: string) {
    return relative(child, parent).startsWith('..');
}
