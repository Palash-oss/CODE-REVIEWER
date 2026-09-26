import { Injectable, OnModuleInit } from '@nestjs/common';
import { Parser, Language } from 'web-tree-sitter';
import { chunkWithAst } from './chunker';
import { chunkPlainText } from './fallback-chunker';

export interface CodeChunk {
  content: string;
  startLine: number;
  endLine: number;
  type: 'function' | 'class' | 'block';
  name?: string;
}

@Injectable()
export class ParsingService implements OnModuleInit {
  private jsParser: Parser;
  private tsParser: Parser;
  private pyParser: Parser;
  private goParser: Parser;

  async onModuleInit() {
    await Parser.init();
    this.jsParser = await this.loadParser('tree-sitter-javascript/tree-sitter-javascript.wasm');
    this.tsParser = await this.loadParser('tree-sitter-typescript/tree-sitter-typescript.wasm');
    this.pyParser = await this.loadParser('tree-sitter-python/tree-sitter-python.wasm');
    this.goParser = await this.loadParser('tree-sitter-go/tree-sitter-go.wasm');
  }

  private async loadParser(wasmFile: string): Promise<Parser> {
    const parser = new Parser();
    const lang = await Language.load(`./node_modules/${wasmFile}`);
    parser.setLanguage(lang);
    return parser;
  }

  private getParserForFile(fileName: string): Parser | null {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return this.tsParser;
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return this.jsParser;
    if (fileName.endsWith('.py')) return this.pyParser;
    if (fileName.endsWith('.go')) return this.goParser;
    return null;
  }

  chunkFile(fileName: string, content: string): CodeChunk[] {
    const parser = this.getParserForFile(fileName);
    if (!parser) return chunkPlainText(content);

    try {
      return chunkWithAst(parser, content);
    } catch {
      return chunkPlainText(content);
    }
  }
}