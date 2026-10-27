import { SourceLocation } from "./errors";

export interface Program {
  type: "program";
  body: Statement[];
}

export interface AssignmentStatement {
  type: "assignment";
  left: Identifier;
  right: Expression;
}

export interface WhileStatement {
  type: "while";
  condition: BooleanExpression;
  body: Statement[];
}

export interface ForStatement {
  type: "for";
  variable: Identifier;
  range: RangeExpression;
  body: Statement[];
}

export interface IfStatement {
  type: "if";
  condition: BooleanExpression;
  body: Statement[];
  else?: Statement[];
}

export interface FunctionDefinitionStatement {
  type: "functionDefinition";
  name: string;
  parameters: Identifier[];
  body: Statement[];
}

export type Statement = (
  | AssignmentStatement
  | WhileStatement
  | ForStatement
  | CommandStatement
  | IfStatement
  | FunctionDefinitionStatement
  | ReturnStatement
  | Expression
) & { location?: SourceLocation };

export interface ReturnStatement {
  type: "return";
  expression: Expression;
}

export interface ForwardCommandStatement {
  type: "command";
  command: "forward";
  distance: ArithmeticExpression;
}

export interface RotateCommandStatement {
  type: "command";
  command: "rotate";
  angle: ArithmeticExpression;
  unit: "rad" | "deg";
}

export interface PlaceCommandStatement {
  type: "command";
  command: "place";
  x: ArithmeticExpression;
  y: ArithmeticExpression;
}

export interface CursorCommandStatement {
  type: "command";
  command: "cursor";
  state: "on" | "off";
}

export interface BreadcrumbCommandStatement {
  type: "command";
  command: "breadcrumb";
  action: "pop" | "push";
}

export interface ColorCommandStatement {
  type: "command";
  command: "color";
  // a CSS color name, a hex code, or "default" for the drawing's normal ink
  color: string;
}

export type CommandStatement =
  | ForwardCommandStatement
  | RotateCommandStatement
  | PlaceCommandStatement
  | CursorCommandStatement
  | BreadcrumbCommandStatement
  | ColorCommandStatement;

export interface Operation {
  type: "operation" | "unaryOperation";
  left: Expression;
  operator: string;
  right: Expression;
}

export type Expression =
  | Operation
  | Identifier
  | NumberConstant
  | BooleanConstant
  | FunctionCall;

export type Identifier = {
  type: "identifier";
  name: string;
  location?: SourceLocation;
};
export interface BooleanConstant {
  type: "boolean";
  value: boolean;
}

export interface FunctionCall {
  type: "functionCall";
  name: string;
  arguments: Expression[];
  location?: SourceLocation;
}
// only functinos already present in Math object
export const supportedNativeMathFunctions = [
  "abs",
  "acos",
  "acosh",
  "asin",
  "asinh",
  "atan",
  "atanh",
  "atan2",
  "cbrt",
  "ceil",
  "clz32",
  "cos",
  "cosh",
  "exp",
  "expm1",
  "floor",
  "fround",
  "hypot",
  "imul",
  "log",
  "log1p",
  "log10",
  "log2",
  "max",
  "min",
  "pow",
  "random",
  "round",
  "sign",
  "sin",
  "sinh",
  "sqrt",
  "tan",
  "tanh",
  "trunc",
] as const;

export interface NumberConstant {
  type: "number";
  value: number;
}

export type BooleanExpression = Operation;

export type RangeExpression = [ArithmeticExpression, ArithmeticExpression];

export type ArithmeticExpression = Expression;
