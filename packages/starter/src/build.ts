import { build, serve } from 'esbuild';
import { ESBUILD_SERVE_PORT } from './dev-server';
import { UserConfig } from '@ewas/types';
import { esbuildHtmlPlugin } from '@ewas/esbuild-plugin-html';
import {
  esbuildInfoPlugin,
  showRebuildInfo
} from '@ewas/esbuild-plugin-build-info';

export async function runBuildFirstTime(config: UserConfig): Promise<void> {
  await build({
    ...(config.esbuildOptions),
    write: true,
    plugins: [esbuildHtmlPlugin(config), esbuildInfoPlugin(config)]
  });
}

export async function buildOnServe(config: UserConfig) {
  const { esbuildOptions } = config;
  serve(
    {
      port: ESBUILD_SERVE_PORT,
      servedir: esbuildOptions!.outdir,
      onRequest: showRebuildInfo
    },
    {
      ...esbuildOptions
    }
  );
}
