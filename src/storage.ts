import { ExampleFile } from "./examples";

// the editor's contents and what they were loaded from, kept across page reloads
export interface SavedScript {
  loaded: ExampleFile;
  script: string;
}

const storageKey = "plumeto-script";

export function loadSavedScript(): SavedScript | null {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (
      typeof saved?.script === "string" &&
      typeof saved?.loaded?.fileName === "string" &&
      typeof saved?.loaded?.fileContents === "string"
    ) {
      return saved;
    }
  } catch {
    // unavailable storage or unreadable data both mean there's nothing to restore
  }
  return null;
}

export function saveScript(saved: SavedScript) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(saved));
  } catch {
    // not remembering the script is fine (private mode, full or blocked storage)
  }
}
