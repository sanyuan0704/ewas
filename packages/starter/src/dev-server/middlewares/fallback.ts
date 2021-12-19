import express from 'express';
import path from 'path';
import fs from 'fs';
import { injectScript } from '..';
import { UserConfig } from '@ewas/types';

export function historyFallbackMiddware(
  config: UserConfig
): express.RequestHandler {
  return (_req, res, next): void => {
    const templatePath = path.resolve(
      process.cwd(),
      config.esbuildOptions!.outdir!,
      'index.html'
    );
    if (fs.existsSync(templatePath)) {
      res.contentType('.html');
      res.statusCode = 200;
      const templateContent = fs
        .readFileSync(templatePath, 'utf-8')
        .replace('</body>', (m): string => `${injectScript}${m}`);
      res.send(templateContent);
    } else {
      next();
    }
  };
}
