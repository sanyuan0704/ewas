import path from "path";

export default {
  esbuildOptions: {
    entryPoints: [path.resolve(__dirname, "src/main.tsx")],
  },
};
