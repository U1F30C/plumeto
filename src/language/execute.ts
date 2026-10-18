import { PlumetoError } from "./errors";
import { parser } from "./parser";
import { Program } from "./program";
import { LineSegment, ProgramRunner } from "./program_runner";

// Parses and runs a script. Every failure is thrown as a PlumetoError that
// says whether it is a syntax or runtime error and where in the source it is.
// Lines drawn before a runtime error has been thrown are still passed to addLine.
export function execute(source: string, addLine: (line: LineSegment) => void) {
  let program: Program;
  try {
    program = parser.parse(source) as Program;
  } catch (error) {
    if (error instanceof parser.SyntaxError) {
      // peggy's own message lists every token it could have accepted, which is
      // mostly noise; the location already says where the problem is
      const message =
        error.found === null
          ? "Unexpected end of script"
          : `Unexpected ${JSON.stringify(error.found)}`;
      throw new PlumetoError(message, "syntax", error.location);
    }
    throw error;
  }
  new ProgramRunner().run(program, addLine);
}
