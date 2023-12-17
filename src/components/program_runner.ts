import {
  ArithmeticExpression,
  AssignmentStatement,
  BooleanExpression,
  CommandStatement,
  CursorCommandStatement,
  Expression,
  ForStatement,
  ForwardCommandStatement,
  Operation,
  PlaceCommandStatement,
  Program,
  RangeExpression,
  RotateCommandStatement,
  Statement,
  WhileStatement,
} from "../language/program";

type ExecutionContext = Record<string, any>;

export type LineSegment = [number, number, number, number];

export class ProgramRunner {
  executionContext: ExecutionContext = {};
  cursor: {
    x: number;
    y: number;
    angle: number;
    cursorOn: boolean;
  } = {
    x: 0,
    y: 0,
    angle: 0,
    cursorOn: true,
  };
  addLine: (line: LineSegment) => void = () => {};
  constructor() {
    this.executionContext = {};
  }

  run(program: Program, addLine: (line: LineSegment) => void) {
    this.executionContext = {};
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
      case "command":
        this.executeCommandStatement(statement);
        break;
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
      this.executionContext[statement.variable.name] = i;
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
    this.executionContext[statement.left.name] = this.resolveExpression(
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
    }
  }
  executeForwardCommandStatement(statement: ForwardCommandStatement) {
    const newCursorX =
      this.cursor.x +
      Math.cos(this.cursor.angle) *
        this.resolveArithmeticExpression(statement.distance);
    const newCursorY =
      this.cursor.y +
      Math.sin(this.cursor.angle) *
        this.resolveArithmeticExpression(statement.distance);

    if (this.cursor.cursorOn) {
      this.addLine([this.cursor.x, this.cursor.y, newCursorX, newCursorY]);

    }
    this.cursor.x = newCursorX;
    this.cursor.y = newCursorY;
  }
  executeRotateCommandStatement(statement: RotateCommandStatement) {
    this.cursor.angle =
      this.cursor.angle +
      this.getAngleInRadians(
        this.resolveArithmeticExpression(statement.angle),
        statement.unit
      );
  }
  executePlaceCommandStatement(statement: PlaceCommandStatement) {
    this.cursor.x = this.resolveArithmeticExpression(statement.x);
    this.cursor.y = this.resolveArithmeticExpression(statement.y);
  }
  executeCursorCommandStatement(statement: CursorCommandStatement) {
    this.cursor.cursorOn = statement.state === "on";
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
      return this.executionContext[expression.name];
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
