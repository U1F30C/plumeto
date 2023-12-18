import {
  ArithmeticExpression,
  AssignmentStatement,
  BooleanExpression,
  BreadcrumbCommandStatement,
  CommandStatement,
  CursorCommandStatement,
  Expression,
  ForStatement,
  ForwardCommandStatement,
  IfStatement,
  Operation,
  PlaceCommandStatement,
  Program,
  RangeExpression,
  RotateCommandStatement,
  Statement,
  WhileStatement,
} from "../language/program";

export type LineSegment = [number, number, number, number];

interface ExecutionContext {
  symbols: Record<string, any>;
  cursor: {
    x: number;
    y: number;
    angle: number;
    cursorOn: boolean;
  };
  locationStack: [x: number, y: number, angle: number][];
}

export class ProgramRunner {
  ctx: ExecutionContext;
  addLine: (line: LineSegment) => void = () => {};
  constructor() {
    this.ctx = this.newContext();
  }
  private newContext() {
    return {
      symbols: {},
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
    this.addLine = addLine;
    this.executeStatements(program.body);
  }

  executeStatements(statements: Statement[]) {
    for (let statement of statements) {
      this.executeStatement(statement);
    }
  }

  executeStatement(statement: Statement) {
    switch (statement.type) {
      case "assignment":
        this.executeAssignmentStatement(statement);
        break;
      case "while":
        this.executeWhileStatement(statement);
        break;
      case "for":
        this.executeForStatement(statement);
        break;
      case "if":
        this.executeIfStatement(statement);
        break;
      case "command":
        this.executeCommandStatement(statement);
        break;
    }
  }
  executeIfStatement(statement: IfStatement) {
    if (this.resolveBooleanExpression(statement.condition)) {
      this.executeStatements(statement.body);
    } else if (statement.else) {
      this.executeStatements(statement.else);
    }
  }
  executeWhileStatement(statement: WhileStatement) {
    while (this.resolveBooleanExpression(statement.condition)) {
      this.executeStatements(statement.body);
    }
  }
  executeForStatement(statement: ForStatement) {
    const [start, end] = this.resolveRangeExpression(statement.range);
    const direction = start < end ? 1 : -1;
    for (let i = start; i * direction <= end * direction; i += direction) {
      this.ctx.symbols[statement.variable.name] = i;
      this.executeStatements(statement.body);
    }
  }
  resolveRangeExpression(range: RangeExpression): [number, number] {
    return [
      this.resolveArithmeticExpression(range[0]),
      this.resolveArithmeticExpression(range[1]),
    ];
  }
  executeAssignmentStatement(statement: AssignmentStatement) {
    this.ctx.symbols[statement.left.name] = this.resolveExpression(
      statement.right
    );
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
      this.addLine([
        this.ctx.cursor.x,
        this.ctx.cursor.y,
        newCursorX,
        newCursorY,
      ]);
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
        throw new Error("Unknown identifier: " + expression.name);
      }
      return value;
    } else if (expression.type === "operation") {
      return this.resolveOperation(expression);
    } else if (expression.type === "unaryOperation") {
      return this.resolveUnaryOperation(expression);
    } else {
      throw new Error("Unknown expression type");
    }
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
