#!/usr/bin/env node
import path from "path";
import { Project } from "ts-morph";
import { findNodeOrThrow } from "~/ast";
import { readConfig } from "~/config";
import { isAppRouterAlias, isContext, isMiddleware, isRouter } from "~/guard";
import { getAllTransformers, pruneRouter, redefine } from "~/transformer";

const main = async () => {
  const cfg = await readConfig("xtrpc.config.json");

  const srcProj = new Project({
    tsConfigFilePath: `${cfg.srcProject}/tsconfig.json`,
    compilerOptions: { outDir: "dist", declaration: true, noEmit: false },
  });

  const srcFiles = srcProj.getSourceFiles();

  const transformers = getAllTransformers(srcFiles, [
    [isContext, redefine("any")],
    [isMiddleware, redefine("t.middleware(({ ctx, next }) => next({ ctx }))")],
    [isRouter, pruneRouter(cfg.include, cfg.explicitOutputs)],
  ]);

  for (const transform of transformers) {
    transform();
  }

  const [appRouter, rootFile] = findNodeOrThrow(
    srcFiles,
    isAppRouterAlias(cfg.parserOptions.appRouterAlias),
  );
  appRouter.replaceWithText("API");

  const [dstFile] = srcProj
    .getSourceFileOrThrow(rootFile.getBaseName())
    .getEmitOutput({ emitOnlyDtsFiles: true })
    .getOutputFiles();

  const dstProj = new Project({
    tsConfigFilePath: `${cfg.dstProject}/tsconfig.json`,
  });

  if (!dstFile) {
    throw new Error("Could not emit output.");
  }

  const outPath = path.join(cfg.dstProject, cfg.outDir, cfg.outName);

  dstProj.createSourceFile(outPath, dstFile.getText(), {
    overwrite: cfg.overwrite,
  });

  await dstProj.save();

  return `Generated ${outPath}`;
};

main().then(console.log.bind(console)).catch(console.error.bind(console));
