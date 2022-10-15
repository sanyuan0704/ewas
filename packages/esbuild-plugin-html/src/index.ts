import { Plugin, Metafile } from 'esbuild';
import path from 'path';
import { readFileSync } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import { HTMLBuilder } from './HTMLBuilder';
import { UserConfig } from '@ewas/types';

type ScriptType = 'blocking' | 'defer' | 'module' | 'async';

const CHUNK_REGEXP = /\.(js|css)$/;

const isChunk = (name: string): boolean => CHUNK_REGEXP.test(name);

//创建文件的软链
function createTag(
  tag: string,
  attr: Record<string, string | boolean>
): string {
  const attrStr = Object.keys(attr)
    .map((key: string): string => {
      if (attr[key] === true) {
        return key;
      }
      return `${key}="${attr[key]}" `;
    })
    .join('');

  return `<${tag} ${attrStr}></${tag}>`;
}

export function esbuildHtmlPlugin(config: UserConfig): Plugin {
  const htmlConfig = config.html || {};
  const {
    crossorigin = true,
    template,
    templateContent,
    publicPath: templatePublicPath,
    filename,
    scriptLoading
  } = htmlConfig!;
  const { publicPath, entryPoints, outdir, absWorkingDir } = config.esbuildOptions!;
  let templateStr: string;
  if (templateContent && template) {
    throw new Error(
      'You should only provide one of `template` and `templateContent`'
    );
  }
  if (templateContent) {
    templateStr = templateContent;
  } else if (template) {
    const templatePath = path.isAbsolute(template)
      ? template
      : path.join(absWorkingDir!, template);
    templateStr = readFileSync(templatePath, 'utf-8');
  } else {
    try {
      templateStr = readFileSync(
        path.join(absWorkingDir!, 'src', 'index.html'),
        'utf-8'
      );
    } catch (e) {
      templateStr = readFileSync(
        path.join(__dirname, '..', 'template', 'index.html'),
        'utf-8'
      );
    }
  }

  const generateHtml = async (
    entrypoint: string,
    metafile?: Metafile
  ): Promise<void> => {
    let fileBaseName = filename || 'index.html';
    // resolve output html path
    // (entry) => path， maybe a filename or relative path
    // such as filename: (entry) => `${entry}.html` or `template/${entry}.html`
    if (typeof filename === 'function') {
      fileBaseName = filename.call(null, entrypoint);
    }

    const filepath = path.join(outdir!, fileBaseName as string);

    const createScript = (
      chunkPath: string,
      type: ScriptType = 'blocking'
    ): string => {
      const assetMap: Record<string, string | boolean> = {};
      // eslint-disable-next-line default-case
      switch (type) {
        case 'defer':
          assetMap.defer = true;
          break;
        case 'async':
          assetMap.async = true;
          break;
        case 'module':
          assetMap.type = 'module';
      }
      const finalPublicPath = templatePublicPath ?? publicPath!;
      const scriptPath = path.join(finalPublicPath, chunkPath);
      assetMap.src = scriptPath;
      if (crossorigin) {
        assetMap.crossorigin = crossorigin === true ? 'anonymous' : crossorigin;
      }
      return createTag('script', assetMap);
    };

    const createLink = (chunkPath: string): string => {
      const assetMap: Record<string, string | boolean> = {};
      const finalPublicPath = templatePublicPath ?? publicPath!;
      const cssLinkPath = path.join(finalPublicPath, chunkPath);
      assetMap.rel = 'stylesheet';
      assetMap.href = cssLinkPath;
      return createTag('link', assetMap);
    };

    const scripts: string[] = [];
    const links: string[] = [];

    if (metafile) {
      const { outputs } = metafile;
      const assets = Object.keys(outputs)
        // such as build/index.js , need to extract `build`
        .map((item: string): string => item.replace(outdir!, ''))
        .filter((item: string): boolean => isChunk(item));

      assets.forEach((asset: string): void => {
        if (asset.endsWith('.js')) {
          scripts.push(createScript(asset, scriptLoading));
        } else if (asset.endsWith('.css')) {
          links.push(createLink(asset));
        }
      });
    }

    const templateHTML = new HTMLBuilder(templateStr)
      .appendHead(links.join('\n'))
      .appendBody(scripts.join('\n'))
      .finish();

    await mkdir(path.dirname(filepath), {
      recursive: true
    });
    await writeFile(filepath, templateHTML);
  };
  return {
    name: 'esbuild:html',
    setup(builder): void {
      builder.onEnd(async (buildResult): Promise<void> => {
        if (buildResult.errors.length) {
          return;
        }
        const { metafile } = buildResult;
        const entries = Array.isArray(entryPoints)
          ? entryPoints
          : Object.keys(entryPoints!);
        await Promise.all(
          entries.map((entry): Promise<void> => generateHtml(entry, metafile))
        );
      });
    }
  };
}
