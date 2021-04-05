import { resolve } from "path";
import { exists, readFile } from '../utils/file-system';

export async function jsonFile(input: string): Promise<string> {
    const filePath = resolve(process.cwd(), input);
    const fileExists = await exists(filePath);
    if (fileExists) {
        try {
            const content = await readFile(filePath, 'utf8');
            return content.toString();
        } catch (e) {
            throw new Error(`Could not read OpenApi spec: "${filePath}"`);
        }
    }
    throw new Error(`Could not find OpenApi spec: "${filePath}"`);
}
