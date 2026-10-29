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

// the filter chips of the example gallery: each one gathers one or more folders
export const exampleCategories = [
  { label: 'Basics', folders: ['basics'] },
  { label: 'Geometric', folders: ['patterns'] },
  { label: 'Strings & spirals', folders: ['whirls', 'string-art', 'spirographs'] },
  { label: 'Flourishes', folders: ['flourishes'] },
  { label: 'Fractals', folders: ['golden-ratio', 'l-systems'] },
]

// shown first in the gallery and under their own chip, in this order
export const featuredExamples = [
  'scroll-flourish.plm',
  'chord-mandala.plm',
  'spirograph-flowers.plm',
  'spirograph-rosettes.plm',
  'weed(stochastic).plm',
  'golden-flower.plm',
  'penrose-tiling.plm',
  'heptapod-logogram.plm',
  'sierpinski-arrowhead.plm',
]

// listed ahead of the rest of their folder
const firstInFolder = ['weed.plm', 'weed(stochastic).plm', 'weed(expanded).plm']

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

// a file's name without its extension and with spaces, as the gallery shows it
export const exampleTitle = (example: ExampleFile) => example.fileName.replace(/\.plm$/, '').replace(/-/g, ' ')

const folderOrder = (example: ExampleFile) => {
  const index = firstInFolder.indexOf(example.fileName)
  return index === -1 ? firstInFolder.length : index
}

// grouped in section order; within a group, files keep the glob's alphabetical order,
// except the ones listed in firstInFolder
export const examples: ExampleFile[] = Object.entries(modules)
  .map(([path, content]) => {
    const parts = path.split('/')
    return {
      fileName: parts.pop()!,
      fileContents: content as string,
      group: parts.pop()!,
    }
  })
  .sort((a, b) => groupOrder(a) - groupOrder(b) || folderOrder(a) - folderOrder(b))
