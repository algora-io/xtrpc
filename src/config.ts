import fs from "fs/promises";
import { z } from "zod";

const Config = z.object({
  srcProject: z.string().optional().default("."),
  dstProject: z.string().optional().default("."),
  outDir: z.string().optional().default("types"),
  outName: z.string().optional().default("api.d.ts"),
  overwrite: z.boolean().optional().default(false),
  explicitOutputs: z.boolean().optional().default(false),
  include: z.record(z.string().array()).default({}),
  parserOptions: z
    .object({ appRouterAlias: z.string().optional().default("AppRouter") })
    .optional()
    .default({ appRouterAlias: "AppRouter" }),
});

const readFile = async (path: string) => {
  try {
    return await fs.readFile(path, { encoding: "utf8" });
  } catch {
    return undefined;
  }
};

const toJson = (s: string, ctx: z.RefinementCtx) => {
  try {
    return JSON.parse(s);
  } catch {
    ctx.addIssue({ code: "custom", message: "Invalid JSON" });
    return z.NEVER;
  }
};

export const readConfig = async (path: string) =>
  z
    .string()
    .optional()
    .default("{}")
    .transform(toJson)
    .pipe(Config)
    .parse(await readFile(path));
