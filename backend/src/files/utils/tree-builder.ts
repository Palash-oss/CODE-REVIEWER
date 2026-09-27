export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  id?: string;
  children?: TreeNode[];
}

export function buildTree(paths: { path: string; id: string }[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const { path, id } of paths) {
    const parts = path.split('/');
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      let existing = currentLevel.find((n) => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          id: isFile ? id : undefined,
          children: isFile ? undefined : [],
        };
        currentLevel.push(existing);
      } else if (isFile && id) {
        existing.id = id;
      }

      if (!isFile) currentLevel = existing.children!;
    });
  }

  return root;
}