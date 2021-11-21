import { cac } from 'cac';
import { createServer } from './dev-server';

const cli = cac('ews');

cli
  .command('[root]')
  .alias('serve')
  .action(async (root: string) => {
    createServer({ root });
  });

cli.command('init').action(() => {
  require('create-esbuild-app');
});

cli.help();
cli.parse();
