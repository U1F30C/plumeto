import {
  ArithmeticExpression,
  AssignmentStatement,
  BooleanExpression,
  BreadcrumbCommandStatement,
  ColorCommandStatement,
  CommandStatement,
  CursorCommandStatement,
  Expression,
  ForStatement,
  ForwardCommandStatement,
  FunctionCall,
  FunctionDefinitionStatement,
  IfStatement,
  Operation,
  PlaceCommandStatement,
  Program,
  RangeExpression,
  RotateCommandStatement,
  Statement,
  WhileStatement,
  supportedNativeMathFunctions,
} from "./program";
import { PlumetoError, SourceLocation } from "./errors";
import { isValidColor } from "./colors";

// x1, y1, x2, y2 and the color the line was drawn in; no color means the drawing's normal ink
export type LineSegment = [number, number, number, number, string?];

type Completion = { value: number | boolean } | undefined;

interface ExecutionContext {
  symbols: Record<string, any>;
  functionDefinitions: Record<string, FunctionDefinitionStatement>;
  cursor: {
    x: number;
    y: number;
    angle: number;
    cursorOn: boolean;
    color?: string;
  };
  locationStack: [x: number, y: number, angle: number][];
}

export class ProgramRunner {
  ctx: ExecutionContext;
  addLine: (line: LineSegment) => void = () => {};
  // how many function calls deep we are, a return is only valid above 0
  callDepth = 0;
  constructor() {
    this.ctx = this.newContext();
  }
  private cloneContext() {
    const ctx = this.ctx;
    return {
      symbols: { ...ctx.symbols },
      functionDefinitions: { ...ctx.functionDefinitions },
      cursor: { ...ctx.cursor },
      locationStack: [...ctx.locationStack],
    };
  }
  private newContext(): ExecutionContext {
    return {
      symbols: {},
      functionDefinitions: {},
      cursor: {
        x: 0,
        y: 0,
        angle: 0,
        cursorOn: true,
      },
      locationStack: [],
    };
  }

  run(program: Program, addLine: (line: LineSegment) => void) {
    this.ctx = this.newContext();
    this.callDepth = 0;
    this.addLine = addLine;
    this.executeStatements(program.body);
  }

  // a Completion is set when a return statement ran, and carries its value up
  // through enclosing blocks until the function call that consumes it
  executeStatements(statements: Statement[]): Completion {
    for (let statement of statements) {
      const completion = this.executeStatement(statement);
      if (completion) {
        return completion;
      }
    }
  }

  executeStatement(statement: Statement): Completion {
    try {
      return this.runStatement(statement);
    } catch (error) {
      throw locateError(error, statement.location);
    }
  }

  private runStatement(statement: Statement): Completion {
    switch (statement.type) {
      case "assignment":
        this.executeAssignmentStatement(statement);
        break;
      case "while":
        return this.executeWhileStatement(statement);
      case "for":
        return this.executeForStatement(statement);
      case "if":
        return this.executeIfStatement(statement);
      case "return":
        if (this.callDepth === 0) {
          throw new PlumetoError("return used outside of a function", "runtime");
        }
        return { value: this.resolveExpression(statement.expression) };
      case "command":
        this.executeCommandStatement(statement);
        break;
      case "functionDefinition":
        this.executeFunctionDefinitionStatement(statement);
        break;
      default:
        // bare expressions are evaluated too, so typos like an unknown name still error
        this.resolveExpression(statement);
        break;
    }
  }
  executeFunctionDefinitionStatement(statement: FunctionDefinitionStatement) {
    this.ctx.functionDefinitions[statement.name] = statement;
  }
  executeIfStatement(statement: IfStatement): Completion {
    if (this.resolveBooleanExpression(statement.condition)) {
      return this.executeStatements(statement.body);
    } else if (statement.else) {
      return this.executeStatements(statement.else);
    }
  }
  executeWhileStatement(statement: WhileStatement): Completion {
    while (this.resolveBooleanExpression(statement.condition)) {
      const completion = this.executeStatements(statement.body);
      if (completion) {
        return completion;
      }
    }
  }
  executeForStatement(statement: ForStatement): Completion {
    const [start, end] = this.resolveRangeExpression(statement.range);
    const direction = start < end ? 1 : -1;
    for (let i = start; i * direction <= end * direction; i += direction) {
      this.ctx.symbols[statement.variable.name] = i;
      const completion = this.executeStatements(statement.body);
      if (completion) {
        return completion;
      }
    }
  }
  resolveRangeExpression(range: RangeExpression): [number, number] {
    return [
      this.resolveArithmeticExpression(range[0]),
      this.resolveArithmeticExpression(range[1]),
    ];
  }
  executeAssignmentStatement(statement: AssignmentStatement) {
    // resolve first: function calls replace this.ctx, so reading
    // this.ctx.symbols beforehand would write into the stale context
    const value = this.resolveExpression(statement.right);
    this.ctx.symbols[statement.left.name] = value;
  }

  executeCommandStatement(statement: CommandStatement) {
    switch (statement.command) {
      case "forward":
        this.executeForwardCommandStatement(statement);
        break;
      case "rotate":
        this.executeRotateCommandStatement(statement);
        break;
      case "place":
        this.executePlaceCommandStatement(statement);
        break;
      case "cursor":
        this.executeCursorCommandStatement(statement);
        break;
      case "breadcrumb":
        this.executeBreadcrumbCommandStatement(statement);
        break;
      case "color":
        this.executeColorCommandStatement(statement);
        break;
    }
  }
  executeBreadcrumbCommandStatement(statement: BreadcrumbCommandStatement) {
    if (statement.action === "push") {
      this.ctx.locationStack.push([
        this.ctx.cursor.x,
        this.ctx.cursor.y,
        this.ctx.cursor.angle,
      ]);
    } else if (statement.action === "pop") {
      if (this.ctx.locationStack.length === 0) {
        throw new PlumetoError(
          "breadcrumb pop without a matching breadcrumb push",
          "runtime"
        );
      }
      const [x, y, angle] = this.ctx.locationStack.pop()!;
      this.ctx.cursor.x = x;
      this.ctx.cursor.y = y;
      this.ctx.cursor.angle = angle;
    } else {
      throw new Error("Unknown breadcrumb command");
    }
  }
  executeForwardCommandStatement(statement: ForwardCommandStatement) {
    const distance = this.resolveArithmeticExpression(statement.distance);
    const newCursorX =
      this.ctx.cursor.x + Math.cos(this.ctx.cursor.angle) * distance;
    const newCursorY =
      this.ctx.cursor.y + Math.sin(this.ctx.cursor.angle) * distance;

    if (this.ctx.cursor.cursorOn) {
      const line: LineSegment = [
        this.ctx.cursor.x,
        this.ctx.cursor.y,
        newCursorX,
        newCursorY,
      ];
      if (this.ctx.cursor.color) line.push(this.ctx.cursor.color);
      this.addLine(line);
    }
    this.ctx.cursor.x = newCursorX;
    this.ctx.cursor.y = newCursorY;
  }
  executeRotateCommandStatement(statement: RotateCommandStatement) {
    this.ctx.cursor.angle =
      this.ctx.cursor.angle +
      this.getAngleInRadians(
        this.resolveArithmeticExpression(statement.angle),
        statement.unit
      );
  }
  executePlaceCommandStatement(statement: PlaceCommandStatement) {
    this.ctx.cursor.x = this.resolveArithmeticExpression(statement.x);
    this.ctx.cursor.y = this.resolveArithmeticExpression(statement.y);
  }
  executeColorCommandStatement(statement: ColorCommandStatement) {
    if (statement.color === "default") {
      this.ctx.cursor.color = undefined;
    } else if (isValidColor(statement.color)) {
      this.ctx.cursor.color = statement.color;
    } else {
      throw new PlumetoError(`Unknown color "${statement.color}"`, "runtime");
    }
  }
  executeCursorCommandStatement(statement: CursorCommandStatement) {
    this.ctx.cursor.cursorOn = statement.state === "on";
  }
  getAngleInRadians(angle: number, unit: "rad" | "deg"): number {
    if (unit === "rad") {
      return angle;
    } else {
      return (angle / 180) * Math.PI;
    }
  }
  resolveArithmeticExpression(expression: ArithmeticExpression): number {
    return this.resolveExpression(expression) as number;
  }
  resolveBooleanExpression(condition: BooleanExpression): boolean {
    return this.resolveExpression(condition) as boolean;
  }
  resolveExpression(expression: Expression): boolean | number {
    if (expression.type === "number") {
      return expression.value;
    } else if (expression.type === "boolean") {
      return expression.value;
    } else if (expression.type === "identifier") {
      const value = this.ctx.symbols[expression.name];
      if (value === undefined) {
        throw new PlumetoError(
          "Unknown identifier: " + expression.name,
          "runtime",
          expression.location
        );
      }
      return value;
    } else if (expression.type === "operation") {
      return this.resolveOperation(expression);
    } else if (expression.type === "unaryOperation") {
      return this.resolveUnaryOperation(expression);
    } else if (expression.type === "functionCall") {
      return this.executeAndResolveFunctionCall(expression) as number | boolean;
    } else {
      throw new Error("Unknown expression type");
    }
  }
  resolveNativeFunctionCall(expression: FunctionCall) {
    const nativeFunction = Math[expression.name as (typeof supportedNativeMathFunctions)[number]];
    const args: any[] = expression.arguments.map((arg) => this.resolveExpression(arg));
    return (nativeFunction as any).apply(null, args);
  }

  executeAndResolveFunctionCall(
    expression: FunctionCall
  ): number | boolean | undefined {
    // probly should have made context management immutable, didn't want to refator all methods
    let definition = this.ctx.functionDefinitions[expression.name];
    if (!definition && expression.name in Math) {
      return this.resolveNativeFunctionCall(expression);
    } else if (!definition) {
      throw new PlumetoError(
        "Unknown function: " + expression.name,
        "runtime",
        expression.location
      );
    }
    const args = expression.arguments.map((arg) => this.resolveExpression(arg));
    const newCtx = this.cloneContext();
    for (let i = 0; i < definition.parameters.length; i++) {
      newCtx.symbols[definition.parameters[i].name] = args[i];
    }
    const oldCtx = this.ctx;
    this.ctx = newCtx;
    this.callDepth++;
    const returnValue = this.executeStatements(definition.body)?.value;
    this.callDepth--;
    // nested calls replace this.ctx, so the body's writes live in whatever it is now, not in newCtx
    const bodyCtx = this.ctx;
    for (const parameter of definition.parameters) {
      delete bodyCtx.symbols[parameter.name];
    }
    // global data is shared between function calls and should be updatable in the function
    // that includes the cursor, locationStack
    // function definitions are scoped to the function
    // symbols declared as function parameters are scoped to the function, otherwhise they are global

    this.ctx = {
      symbols: { ...oldCtx.symbols, ...bodyCtx.symbols },
      functionDefinitions: oldCtx.functionDefinitions,
      cursor: bodyCtx.cursor,
      locationStack: bodyCtx.locationStack,
    };

    return returnValue;
  }
  resolveUnaryOperation(expression: Operation): number | boolean {
    const left = this.resolveExpression(expression.left);
    switch (expression.operator) {
      case "!":
        // TODO: validate type?
        return !left;
      case "-":
        return -left as number;
      default:
        throw new Error("Unknown unary operator");
    }
  }
  resolveOperation(expression: Operation): number | boolean {
    const left = this.resolveExpression(expression.left) as number;
    const right = this.resolveExpression(expression.right) as number;
    // arithmetic
    switch (expression.operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
      case "^":
        return left ** right;
      case "==":
        return left === right;
      case "!=":
        return left !== right;
      case "<":
        return left < right;
      case ">":
        return left > right;
      case "<=":
        return left <= right;
      case ">=":
        return left >= right;
      default:
    }
    const leftBool = left as any as boolean;
    const rightBool = right as any as boolean;
    // boolean
    switch (expression.operator) {
      case "|":
        return leftBool || rightBool;
      case "&":
        return leftBool && rightBool;
      default:
    }
    throw new Error("Unknown operator");
  }
}

// keeps the most specific location: the innermost statement or expression that knows where it is
function locateError(error: unknown, location?: SourceLocation): PlumetoError {
  if (error instanceof PlumetoError) {
    error.location ??= location;
    return error;
  }
  const message = error instanceof Error ? error.message : String(error);
  return new PlumetoError(message, "runtime", location);
}
