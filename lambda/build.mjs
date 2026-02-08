import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: [
    "src/registerUser.ts",
    "src/submitSchedule.ts",
    "src/runMatching.ts",
    "src/getMatchResult.ts",
  ],
  bundle: true,
  outdir: "dist",
  platform: "node",
  target: "node20",
  format: "cjs",
  external: ["@aws-sdk/*"],
});

console.log("Build complete!");
