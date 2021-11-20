import fs from "fs-extra";
import path from "path";
import consola from "consola";
import chalk from "chalk";
import minimist from "minimist";
import prompts from "prompts";
import jsonfile from "jsonfile";
import prettier from "prettier";

const PACKAGE_DIR = "packages";

const getInitialContent = (pkg: string) => `
console.log('pkg');
`;

const getPackageJsonContent = (pkg: string) => ({
  name: pkg,
  version: "0.0.1",
  description: "",
  main: "./src/index.js",
  license: "MIT",
  scripts: {
    build: "tsc",
    watch: "tsc --watch",
    check: "tsc --noEmit",
  },
});

const getTSConfigContent = (pkg: string) => ({
  extends: "../../tsconfig.base.json",
  compilerOptions: {},
  include: ["src"],
});

(async () => {
  const arg = minimist(process.argv.slice(2));

  const pkgName = arg["_"][0];

  consola.info(`Creating ${pkgName}`);

  if (!pkgName) {
    throw new Error();
  }

  const packageDir = path.resolve(PACKAGE_DIR, pkgName);
  const initialFile = path.join(packageDir, "src", "index.ts");
  const packageFile = path.join(packageDir, "package.json");
  const tsconfigFile = path.join(packageDir, "tsconfig.json");

  fs.ensureDirSync(packageDir);
  fs.ensureFileSync(initialFile);

  fs.writeFileSync(initialFile, getInitialContent(pkgName));
  fs.writeFileSync(
    packageFile,
    JSON.stringify(getPackageJsonContent(pkgName), null, 2)
  );
  fs.writeFileSync(
    tsconfigFile,
    JSON.stringify(getTSConfigContent(pkgName), null, 2)
  );

  consola.success(`Create ${pkgName}`);
})();
