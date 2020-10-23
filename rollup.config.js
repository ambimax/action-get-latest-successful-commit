import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import esbuild from "rollup-plugin-esbuild";

export default {
    input: {
        index: "src/index.ts",
    },
    output: {
        dir: "lib",
        format: "cjs",
    },
    plugins: [commonjs(), resolve(), esbuild({ minify: true })],
};
