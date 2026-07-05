const modules = import.meta.glob('../examples/*.plm', { query: '?raw', import: 'default', eager: true })

export interface ExampleFile {
  fileName: string;
  fileContents: string;
}

export const examples: ExampleFile[] = Object.entries(modules).map(([path, content]) => ({
  fileName: path.split('/').pop()!,
  fileContents: content as string,
}))
