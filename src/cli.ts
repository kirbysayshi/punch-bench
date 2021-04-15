#!/usr/bin/env node

/* eslint-env node */

import fs from "fs";
import { tmpNameSync, setGracefulCleanup } from "tmp";
import { rollup } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";

setGracefulCleanup();

const testFile = loadTestFile(process.argv[2] as string);
const tempFile = generateConcatedFile(testFile);

function generateConcatedFile(testFile: string) {
  const tempFile = tmpNameSync();
  const pathToPunchBenchMain = require.resolve("./");

  // Rollup needs a file to load, so we must use a tempfile.
  fs.writeFileSync(
    tempFile,
    `
import {punch, go, configure} from ${JSON.stringify(pathToPunchBenchMain)};
${testFile}
${testFile.indexOf("go()") > -1 ? "" : `;go();`}
`
  );
  return tempFile;
}

function loadTestFile(testPath: string) {
  try {
    fs.statSync(testPath);
  } catch (e) {
    throw new Error("Could not load test file, tried path " + process.argv[2]);
  }

  return fs.readFileSync(testPath, "utf8");
}

async function build() {
  const extensions = [".js", ".jsx", ".ts", ".tsx"];

  const inputOptions = {
    input: tempFile,
    plugins: [
      resolve({ extensions }),
      commonjs(),
      babel({ extensions, babelHelpers: "bundled", include: ["src/**/*"] }),
    ],
  };

  const outputOptions = {};

  const bundle = await rollup(inputOptions);
  const { output } = await bundle.generate(outputOptions);

  // See https://rollupjs.org/guide/en/#rolluprollup
  for (const chunkOrAsset of output) {
    if (chunkOrAsset.type === "asset") {
      console.log("Asset", chunkOrAsset);
      throw new Error(
        `Imported Assets are not supported by punch-bench: ${chunkOrAsset.fileName}`
      );
    } else {
      // Wrap in {} to prevent too many leaks into global
      process.stdout.write(`{\n${chunkOrAsset.code}\n}`);
    }
  }
}

build().catch((err) => {
  throw err;
  process.exit(1);
});
