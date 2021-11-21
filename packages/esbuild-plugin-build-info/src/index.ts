import { Plugin, ServeOnRequestArgs } from 'esbuild';
import readline from 'readline';
import { bold, green, cyan, dim, blue } from 'picocolors';
import os, { NetworkInterfaceInfo } from 'os';
import { UserConfig } from '@ews/types';
import { performance } from 'perf_hooks';

let firstBuild = true;
let canShowRebuildLog = true;
const INTERVAL_TIME = 500;

function clearScreen(): void {
  const repeatCount = process.stdout.rows - 2;
  const blank = repeatCount > 0 ? '\n'.repeat(repeatCount) : '';
  console.log(blank);
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
}

function printUrls(port: number): void {
  Object.values(os.networkInterfaces())
    .flatMap((nInterface): NetworkInterfaceInfo[] => nInterface ?? [])
    .filter(
      (detail): boolean | string =>
        detail && detail.address && detail.family === 'IPv4'
    )
    .map((detail): string => {
      const type = detail.address.includes('127.0.0.1')
        ? 'Local:   '
        : 'Network: ';
      const host = detail.address.replace('127.0.0.1', 'localhost');
      const url = `http://${host}:${bold(port)}`;
      return `  > ${type} ${cyan(url)}`;
    })
    .slice(0, 2)
    .forEach((msg): void => console.log(msg));
}

export function showRebuildInfo(serveArgs: ServeOnRequestArgs): void {
  if (!canShowRebuildLog) {
    return;
  }
  canShowRebuildLog = false;
  if (serveArgs.timeInMS) {
    console.log(
      green('✨ update '),
      blue(`rebuild: ${cyan(serveArgs.timeInMS)} ms`)
    );
  }
  // avoid frequent log in short time
  setTimeout(() => {
    canShowRebuildLog = true;
  }, INTERVAL_TIME);
}

export function esbuildInfoPlugin(config: UserConfig): Plugin {
  let startTime = performance.now();

  return {
    name: 'esbuild:first-build-time',
    setup(builder): void {
      builder.onStart(() => {
        console.log('\n🚀🚀', bold('Esbuild is launching...'));
        startTime = performance.now();
      });

      builder.onEnd((s): void => {
        if (s.errors.length) {
          return;
        }
        const consumedTime = (performance.now() - startTime).toFixed(2);
        if (firstBuild) {
          firstBuild = false;
          clearScreen();
          console.log(cyan('\n EWS') + green(' dev server running at:\n'));
          printUrls(config?.port ?? 9000);
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          console.log(
            dim(`\n   Powered with Esbuild v${require('esbuild').version}`)
          );
          console.log(`\n First build: ${cyan(consumedTime)} ms \n`);
        }
      });
    }
  };
}
