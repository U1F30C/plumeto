import { useEffect, useRef, useState } from "react";
import { ExampleFile, exampleGroups } from "@/examples";
import styles from "@/styles/Home.module.css";

interface ExampleMenuProps {
  examples: ExampleFile[];
  currentName: string;
  modified: boolean;
  onSelect: (example: ExampleFile) => void;
}

// the editor tab: shows what's loaded and opens a list of examples to load
export function ExampleMenu(props: ExampleMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={styles.menu} ref={rootRef}>
      <button
        className={styles.tab}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        title="Load an example"
      >
        <span className={styles.tabName}>{props.currentName}</span>
        {props.modified && (
          <span className={styles.modified} title="Edited since it was loaded" aria-label="edited">
            ●
          </span>
        )}
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className={styles.menuList} role="menu">
          {sections(props.examples).map((section) => (
            <li key={section.folder} role="none">
              <div className={styles.menuHeading} role="presentation">
                {section.label}
              </div>
              <ul className={styles.menuGroup} role="group" aria-label={section.label}>
                {section.examples.map((example) => (
                  <li key={example.fileName} role="none">
                    <button
                      role="menuitem"
                      className={styles.menuItem}
                      onClick={() => {
                        setOpen(false);
                        props.onSelect(example);
                      }}
                    >
                      {example.fileName}
                      {example.fileName === props.currentName && <span aria-hidden="true"> ✓</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// splits the (already ordered) examples into consecutive runs of the same folder
function sections(examples: ExampleFile[]) {
  const result: { folder: string; label: string; examples: ExampleFile[] }[] = [];
  for (const example of examples) {
    const folder = example.group ?? "";
    let section = result[result.length - 1];
    if (section?.folder !== folder) {
      const label = exampleGroups.find((group) => group.folder === folder)?.label ?? folder;
      section = { folder, label, examples: [] };
      result.push(section);
    }
    section.examples.push(example);
  }
  return result;
}
