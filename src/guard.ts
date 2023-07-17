import { ts, type Node } from "ts-morph";

export const isContext = (node: Node) =>
  node.getKind() === ts.SyntaxKind.PropertyAccessExpression &&
  node.getText().endsWith(".context");

export const isMiddleware = (node: Node) =>
  node.getKind() === ts.SyntaxKind.PropertyAccessExpression &&
  node.getText().endsWith(".use");

export const isProcedure = (node: Node) =>
  node.getKind() === ts.SyntaxKind.PropertyAccessExpression &&
  (node.getText().endsWith(".query") ||
    node.getText().endsWith(".mutation") ||
    node.getText().endsWith(".subscription"));

export const isRouter = (node: Node) =>
  node.getKind() === ts.SyntaxKind.Identifier &&
  node.getParent()?.getKind() === ts.SyntaxKind.CallExpression &&
  node.getText() === "router";

export const isAppRouterAlias = (text: string) => (node: Node) =>
  node.getKind() === ts.SyntaxKind.Identifier &&
  node.getParent()?.getKind() === ts.SyntaxKind.TypeAliasDeclaration &&
  node.getText() === text;
