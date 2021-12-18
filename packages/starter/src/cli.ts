import { cac } from 'cac';
import { createServer } from './dev-server';

const cli = cac('ewas');

cli
  .command('[root]')
  .alias('serve')
  .action(async (root: string) => {
    createServer({ root });
  });

cli.command('init').action(() => {
  require('@ewas/create-esbuild-app');
  
});

cli.help();
cli.parse();
