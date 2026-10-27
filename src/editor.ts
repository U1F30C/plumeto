import { HighlightStyle, StreamLanguage, syntaxHighlighting } from "@codemirror/language";
import { Extension, Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";

const keywords = /^(for|in|while|if|else|function|return)\b/;
const commands = /^(forward|rotate|place|cursor|breadcrumb|color)\b/;
const units = /^(deg|rad|on|off|push|pop)\b/;

// highlighting only, the real grammar lives in src/language/grammar.pegjs
const plumeto = StreamLanguage.define({
  name: "plumeto",
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }
    // \d+(\.\d+)? leaves the dots of a range like 1..3 alone
    if (stream.match(/^\d+(\.\d+)?/) || stream.match(/^\.\d+/)) return "number";
    if (stream.match(keywords)) return "keyword";
    if (stream.match(commands)) return "command";
    if (stream.match(units)) return "unit";
    if (stream.match(/^[A-Za-z_]\w*(?=\s*\()/)) return "call";
    if (stream.match(/^[A-Za-z_]\w*/)) return "name";
    if (stream.match(/^(\.\.|[-+*/%^<>=!&|]+)/)) return "operator";
    stream.next();
    return null;
  },
  tokenTable: {
    command: tags.special(tags.keyword),
    unit: tags.atom,
    call: tags.function(tags.variableName),
    name: tags.variableName,
  },
  languageData: {
    commentTokens: { line: "//" },
  },
});

// colors come from CSS variables, so the same style works for both themes
const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "var(--syntax-keyword)" },
  { tag: tags.special(tags.keyword), color: "var(--syntax-command)" },
  { tag: tags.atom, color: "var(--syntax-unit)" },
  { tag: tags.number, color: "var(--syntax-number)" },
  { tag: tags.comment, color: "var(--syntax-comment)", fontStyle: "italic" },
  { tag: tags.function(tags.variableName), color: "var(--syntax-call)" },
  { tag: tags.operator, color: "var(--ink-soft)" },
]);

export const editorTheme = EditorView.theme({
  "&": {
    color: "var(--ink)",
    backgroundColor: "transparent",
    height: "100%",
    fontSize: "0.95rem",
  },
  ".cm-scroller": { fontFamily: "var(--font-code)" },
  ".cm-content": { caretColor: "var(--ink)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--ink)" },
  "&.cm-focused": { outline: "none" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--ink-soft)",
    border: "none",
  },
  ".cm-activeLine": { backgroundColor: "var(--active-line)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--active-line)" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    { backgroundColor: "var(--selection)" },
  ".cm-matchingBracket": { backgroundColor: "var(--selection)", outline: "none" },
  ".cm-tooltip": {
    backgroundColor: "var(--panel)",
    color: "var(--ink)",
    border: "2px solid var(--ink)",
    borderRadius: "6px",
  },
  ".cm-diagnostic-error": { borderLeftColor: "var(--error)" },
  ".cm-lintRange-error": {
    backgroundImage: "none",
    textDecoration: "underline wavy var(--error)",
    textUnderlineOffset: "0.2em",
  },
});

export function editorExtensions(onRun: () => void): Extension[] {
  return [
    plumeto,
    syntaxHighlighting(highlightStyle),
    // highest precedence, otherwise the default Mod-Enter (insert blank line) wins
    Prec.highest(
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            onRun();
            return true;
          },
        },
      ])
    ),
  ];
}
