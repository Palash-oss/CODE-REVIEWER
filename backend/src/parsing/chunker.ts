import { Parser, Node as SyntaxNode } from 'web-tree-sitter';
import { CodeChunk } from './parsing.service';

const CHUNK_NODE_TYPES = [
  'function_declaration',
  'method_definition',
  'class_declaration',
  'arrow_function',
  'function_definition', // python
  'method_declaration',   // go
];

export function chunkWithAst(parser: Parser, content: string): CodeChunk[] {
  const tree = parser.parse(content);
  if (!tree) {
    return [{
      content,
      startLine: 1,
      endLine: content.split('\n').length,
      type: 'block',
    }];
  }

  const chunks: CodeChunk[] = [];

  function walk(node: SyntaxNode) {
    if (CHUNK_NODE_TYPES.includes(node.type)) {
      chunks.push({
        content: content.slice(node.startIndex, node.endIndex),
        startLine: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
        type: node.type.includes('class') ? 'class' : 'function',
        name: node.childForFieldName('name')?.text,
      });
      return; // don't descend into nested functions as separate chunks
    }


     // 2. NO, it's not a function (maybe it's a wrapper, an export, or an 'if' block)
  // So visit all its children to see if any functions are hiding inside!
    for (const child of node.children) walk(child);
  }

  walk(tree.rootNode);

  if (chunks.length === 0) {
    chunks.push({
      content,
      startLine: 1,
      endLine: content.split('\n').length,
      type: 'block',
    });
  }

  return chunks;
}