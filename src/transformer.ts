import { isProcedure } from "./guard";
import { Node, SourceFile, ts } from "ts-morph";
import { getFirstSiblingByKindOrThrow, iterateNodes } from "~/ast";

type Transformer = (node: Node) => Array<() => Node<ts.Node> | void>;

export const getAllTransformers = (
  files: SourceFile[],
  transformations: Array<[(node: Node) => boolean, Transformer]>,
) =>
  [...iterateNodes(files)].flatMap(([node]) =>
    transformations.flatMap(([predicate, transform]) =>
      predicate(node) ? transform(node) : [],
    ),
  );

export const redefine =
  (text: string): Transformer =>
  (node: Node) => {
    const sibling = getFirstSiblingByKindOrThrow(
      node,
      ts.SyntaxKind.SyntaxList,
    );
    return [() => sibling.replaceWithText(text)];
  };

export const pruneRouter =
  (include: Record<string, string[]>, explicitOutputs: boolean): Transformer =>
  (node: Node) => {
    const includeAll = Object.keys(include).length === 0;

    const expr = node
      .getParentOrThrow()
      .getFirstDescendantByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);

    return expr
      .getChildrenOfKind(ts.SyntaxKind.PropertyAssignment)
      .flatMap((route) => {
        const [k, _, v] = route.getChildren();
        if (!k || !v) {
          throw new Error("Unexpected router");
        }

        if (v.getKind() === ts.SyntaxKind.CallExpression) {
          const subrouter = route
            .getFirstAncestorByKindOrThrow(ts.SyntaxKind.VariableDeclaration)
            ?.getFirstChildByKindOrThrow(ts.SyntaxKind.Identifier);

          const match = Object.entries(include).find(
            ([r, procs]) =>
              r === subrouter.getText() && procs.includes(k.getText()),
          );
          if (!match && !includeAll) {
            return [() => route.remove()];
          }

          return explicitOutputs
            ? route
                .getDescendants()
                .flatMap((n) =>
                  isProcedure(n)
                    ? [() => redefine("() => undefined as any")(n)]
                    : [],
                )
            : [];
        }

        if (v.getKind() === ts.SyntaxKind.Identifier) {
          const match = Object.keys(include).find((r) => r === v.getText());
          return match || includeAll ? [] : [() => route.remove()];
        }
        return [];
      });
  };
