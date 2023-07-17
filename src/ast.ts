import { ts, type Node, type SourceFile } from "ts-morph";

export function* iterateNodes(sourceFiles: SourceFile[]) {
  for (const sourceFile of sourceFiles) {
    for (const node of sourceFile.getDescendants()) {
      yield [node, sourceFile] as const;
    }
  }
}

export const findNodeOrThrow = (
  sourceFiles: SourceFile[],
  predicate: (node: Node) => boolean,
) => {
  for (const [node, sourceFile] of iterateNodes(sourceFiles)) {
    if (predicate(node)) {
      return [node, sourceFile] as const;
    }
  }
  throw new Error("Could not find file.");
};

export const getFirstSiblingByKindOrThrow = (
  node: Node,
  kind: ts.SyntaxKind,
) => {
  for (const sibling of node.getNextSiblings()) {
    if (sibling.getKind() === kind) {
      return sibling;
    }
  }
  throw new Error(`A sibling of kind ${kind.toString()} was expected.`);
};
