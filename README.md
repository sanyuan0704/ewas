# pnpm-workspace-template

Common commands:

```bash
pnpm i typescript@beta --filter '*' -D
pnpm add child1 --filter 'parent1' --workspace
pnpm run build --recursive --if-present --parallel --enable-pre-post-scripts --filter ''
pnpm exec jest --recursive --parallel --filter ''

pnpm dlx create-react-app ./my-app
pnpm create react-app my-app

pnpm env use --global lts
pnpm env use --global 16

pnpm publish -r
pnpm publish --tag --access=public --git-checks --report-summary --filter
```

Release workflow:

```bash
pnpm add @changesets/cli -DW
pnpm changeset init
pnpm changeset
pnpm changeset version
pnpm install
git add . && git commit -m 'feat: bump!'
pnpm publish -r
```
