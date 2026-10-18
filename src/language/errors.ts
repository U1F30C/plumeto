export interface SourcePosition {
  offset: number;
  line: number;
  column: number;
}

export interface SourceLocation {
  start: SourcePosition;
  end: SourcePosition;
}

export type ErrorKind = "syntax" | "runtime";

export class PlumetoError extends Error {
  constructor(
    message: string,
    public kind: ErrorKind,
    public location?: SourceLocation
  ) {
    super(message);
    this.name = "PlumetoError";
  }
}
