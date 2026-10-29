import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExampleFile, exampleCategories, exampleGroups, exampleTitle, featuredExamples } from "@/examples";
import type { Theme } from "@/theme";
import { ExampleThumbnail } from "./ExampleThumbnail";
import styles from "@/styles/Home.module.css";

interface ExampleMenuProps {
  examples: ExampleFile[];
  currentName: string;
  modified: boolean;
  theme: Theme;
  onSelect: (example: ExampleFile) => void;
}

const ALL = "All";
const FEATURED = "Featured";

// the editor tab: shows what's loaded and opens the gallery of examples to load
export function ExampleMenu(props: ExampleMenuProps) {
  const [open, setOpen] = useState(false);
  const tabRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    tabRef.current?.focus();
  }

  return (
    <div className={styles.menu}>
      <span className={styles.fileName} title={props.currentName}>
        {props.currentName}
      </span>
      {props.modified && (
        <span className={styles.modified} title="Edited since it was loaded" aria-label="edited">
          ●
        </span>
      )}
      <button
        ref={tabRef}
        className={`${styles.button} ${styles.examplesButton}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        title="Browse the examples"
      >
        <span aria-hidden="true">▦</span> Examples
      </button>
      {open &&
        createPortal(
          <Gallery
            examples={props.examples}
            currentName={props.currentName}
            theme={props.theme}
            onClose={close}
            onSelect={(example) => {
              setOpen(false);
              props.onSelect(example);
            }}
          />,
          document.body
        )}
    </div>
  );
}

// featured examples first, in their own order, then the rest as they come
function orderedExamples(examples: ExampleFile[]) {
  const featured = featuredExamples
    .map((fileName) => examples.find((example) => example.fileName === fileName))
    .filter((example): example is ExampleFile => example !== undefined);
  return [...featured, ...examples.filter((example) => !featured.includes(example))];
}

const isFeatured = (example: ExampleFile) => featuredExamples.includes(example.fileName);

function Gallery(props: {
  examples: ExampleFile[];
  currentName: string;
  theme: Theme;
  onClose: () => void;
  onSelect: (example: ExampleFile) => void;
}) {
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState(ALL);
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);

  // not on touch screens, where focusing it would pop the keyboard over the thumbnails
  useEffect(() => {
    if (matchMedia("(pointer: fine)").matches) searchRef.current?.focus();
  }, []);

  // on the document, because focus can be nowhere inside the gallery, for instance right
  // after the thumbnail that had it was filtered away
  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => event.key === "Escape" && props.onClose();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [props.onClose]);

  const ordered = useMemo(() => orderedExamples(props.examples), [props.examples]);
  const chips = [
    { label: ALL, count: ordered.length },
    { label: FEATURED, count: ordered.filter(isFeatured).length },
    ...exampleCategories.map((category) => ({
      label: category.label,
      count: ordered.filter((example) => category.folders.includes(example.group ?? "")).length,
    })),
  ];

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const folders = exampleCategories.find((category) => category.label === chip)?.folders;
    return ordered.filter((example) => {
      if (chip === FEATURED && !isFeatured(example)) return false;
      if (folders && !folders.includes(example.group ?? "")) return false;
      const folderLabel = exampleGroups.find((group) => group.folder === example.group)?.label ?? "";
      const text = `${exampleTitle(example)} ${folderLabel}`.toLowerCase();
      return words.every((word) => text.includes(word));
    });
  }, [ordered, chip, query]);

  const tiles = () => [...(gridRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];

  // arrow keys move between thumbnails, like moving between the cells of a grid
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const inSearch = event.target === searchRef.current;
    if (event.key === "/" && !inSearch) {
      event.preventDefault();
      searchRef.current?.focus();
      return;
    }
    const buttons = tiles();
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    if (inSearch && event.key === "ArrowDown") {
      event.preventDefault();
      buttons[0]?.focus();
      return;
    }
    if (index === -1) return;
    const columns = buttons.filter((button) => button.offsetTop === buttons[0].offsetTop).length;
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    if (index + step < 0) searchRef.current?.focus();
    else buttons[Math.min(index + step, buttons.length - 1)].focus();
  }

  return (
    <div
      className={styles.galleryBackdrop}
      onPointerDown={(event) => event.target === event.currentTarget && props.onClose()}
      onKeyDown={onKeyDown}
    >
      <div className={styles.gallery} role="dialog" aria-modal="true" aria-label="Examples">
        <div className={styles.galleryBar}>
          <input
            ref={searchRef}
            className={styles.search}
            type="search"
            placeholder={`Search ${ordered.length} examples…`}
            aria-label="Search the examples"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className={styles.iconButton} onClick={props.onClose} aria-label="Close the examples" title="Close (Esc)">
            ✕
          </button>
        </div>
        <div className={styles.chips} role="group" aria-label="Show">
          {chips.map(({ label, count }) => (
            <button key={label} className={styles.chip} aria-pressed={chip === label} onClick={() => setChip(label)}>
              {label} <span className={styles.chipCount}>{count}</span>
            </button>
          ))}
        </div>
        <div className={styles.galleryScroll}>
          {shown.length === 0 ? (
            <p className={styles.noExamples}>No example matches.</p>
          ) : (
            <ul className={styles.tiles} ref={gridRef}>
              {shown.map((example) => (
                <li key={example.fileName}>
                  <button
                    className={styles.tile}
                    aria-current={example.fileName === props.currentName ? "true" : undefined}
                    onClick={() => props.onSelect(example)}
                  >
                    <ExampleThumbnail example={example} theme={props.theme} />
                    <span className={styles.tileName}>
                      {isFeatured(example) && <span className={styles.star} aria-label="featured">★ </span>}
                      {exampleTitle(example)}
                    </span>
                    <span className={styles.tileFolder}>
                      {example.fileName === props.currentName
                        ? "loaded"
                        : exampleGroups.find((group) => group.folder === example.group)?.label ?? example.group}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className={styles.galleryHint}>
          <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>→</kbd> move · <kbd>Enter</kbd> loads · <kbd>/</kbd> searches · <kbd>Esc</kbd> closes
        </p>
      </div>
    </div>
  );
}
