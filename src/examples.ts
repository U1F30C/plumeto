const modules = import.meta.glob('../examples/**/*.plm', { query: '?raw', import: 'default', eager: true })

// sections of the example menu, in order: the folder under examples/ and its heading
export const exampleGroups = [
  { folder: 'basics', label: 'Basics' },
  { folder: 'patterns', label: 'Patterns' },
  { folder: 'whirls', label: 'Whirls' },
  { folder: 'string-art', label: 'String art' },
  { folder: 'spirographs', label: 'Spirographs' },
  { folder: 'flourishes', label: 'Flourishes' },
  { folder: 'golden-ratio', label: 'Golden ratio' },
  { folder: 'l-systems', label: 'L-systems' },
]

export interface ExampleFile {
  fileName: string;
  fileContents: string;
  // folder it came from; absent for scripts that aren't examples (shared links, older saves)
  group?: string;
}

const groupOrder = (example: ExampleFile) => {
  const index = exampleGroups.findIndex((group) => group.folder === example.group)
  return index === -1 ? exampleGroups.length : index
}

// grouped in section order; within a group, files keep the glob's alphabetical order
export const examples: ExampleFile[] = Object.entries(modules)
  .map(([path, content]) => {
    const parts = path.split('/')
    return {
      fileName: parts.pop()!,
      fileContents: content as string,
      group: parts.pop()!,
    }
  })
  .sort((a, b) => groupOrder(a) - groupOrder(b))
