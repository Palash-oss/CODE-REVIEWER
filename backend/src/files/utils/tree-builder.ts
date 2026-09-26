export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

export function buildTree(paths: { path: string; id: string }[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const { path } of paths) {
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
          children: isFile ? undefined : [],
        };
        currentLevel.push(existing);
      }

      if (!isFile) currentLevel = existing.children!;
    });
  }

  return root;
}