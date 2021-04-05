import { CLIOptions } from './types';
import { RefResolver } from './ref-resolver';
import { Parser } from './read/parse';
import { resolveFile } from './write/resolve-file';
const program = require('commander');
const pkg = require('../package.json');

program
    .version(pkg.version)
    .requiredOption('-i, --input <value>', 'OpenAPI specification, can be a path, url or string content (required)')
    .requiredOption('-o, --output <value>', 'Output directory (required)')
    .parse(process.argv);

const options = program.opts();

async function cli({input, output}: CLIOptions): Promise<void> {
    const openApi = await Parser.parse(input);

    const crawler = new RefResolver(openApi, input);
    const result = {
        ...await crawler.resolve(openApi, input),
        components: {
            schemas: crawler.getSchemas()
        }
    };

    return resolveFile(result, output, 'test.json');
}

cli({
    input: options.input,
    output: options.output,
})
    .then(() => {
        process.exit(0);
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
