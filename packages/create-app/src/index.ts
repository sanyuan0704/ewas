#!/usr/bin/env node

import prompts from 'prompts';
import minimist from 'minimist';
import { blue, cyan, gray } from 'kolorist';
import path from 'path';
import fs from 'fs';

type Framework = 'vue' | 'react' | 'vanilla';
type Language = 'js' | 'ts';
type PackageManager = 'npm' | 'yarn' | 'pnpm';

interface ProjectInfo {
  name: string;
  framework: Framework;
  language: Language;
}

const FRAMEWORKS = [
  {
    name: 'react',
    color: blue
  }
  // {
  //   name: 'vue',
  //   color: green
  // },
  // {
  //   name: 'vanilla',
  //   color: cyan
  // }
];

const LANGUAGES = [
  {
    name: 'TypeScript',
    value: 'ts',
    color: blue
  },
  {
    name: 'JavaScript',
    value: 'js',
    color: gray
  }
];

const DEFAULT_OUTPUT_DIR = 'esbuild-app';
const renameMap: Record<string, string> = {
  _gitignore: '.gitignore'
};
const commandMap = {
  npm: {
    install: 'npm i',
    start: 'npm start'
  },
  yarn: {
    install: 'yarn',
    start: 'yarn start'
  },
  pnpm: {
    install: 'pnpm i',
    start: 'pnpm start'
  }
};

const cwd = process.cwd();
const argv = minimist(process.argv.slice(2));
let outputDir;

const promptsChain: prompts.PromptObject<string>[] = [
  {
    type: 'text',
    name: 'name',
    message: 'Project name:',
    initial: DEFAULT_OUTPUT_DIR,
    onState(state) {
      outputDir = state.value.trim() || DEFAULT_OUTPUT_DIR;
    }
  },
  {
    type: 'select',
    name: 'framework',
    message: 'Select a framework:',
    initial: 0,
    choices: FRAMEWORKS.map((framework) => ({
      title: framework.color(framework.name),
      value: framework.name
    }))
  },
  {
    type: 'select',
    name: 'language',
    message: 'Select a language:',
    initial: 0,
    choices: LANGUAGES.map((item) => ({
      title: item.color(item.name),
      value: item.value
    }))
  }
];

function copy(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    for (const file of files) {
      // Probably need rename for output file.
      const renamedFile = renameMap[file] ?? file;
      const srcPath = path.resolve(src, file);
      const destPath = path.resolve(dest, renamedFile);
      copy(srcPath, destPath);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function getManager() {
  // npm/6.14.15 node/v14.18.1 darwin x64
  const config = process.env.npm_config_user_agent;
  return config?.split('/')[0] as PackageManager;
}

async function init() {
  let projectInfo = (await prompts(promptsChain)) as ProjectInfo;
  const { name, framework, language } = projectInfo;

  const rootPath = path.join(cwd, name);
  const templatePath = path.join(
    __dirname,
    '..',
    'template',
    `${framework}-${language}`
  );
  console.log(cyan(`Genrating project in ${rootPath}...\n`));
  copy(templatePath, rootPath);
  const packgeManager = getManager() ?? 'npm';
  console.log('✅ Done. You can start project by these steps:\n');
  console.log(` 👀 1. cd ${cyan(name)}`);
  console.log(` ✨ 2. ${commandMap[packgeManager]['install']}`);
  console.log(` 🚀 3. ${commandMap[packgeManager]['start']}\n`);
}

init().catch(console.log);
