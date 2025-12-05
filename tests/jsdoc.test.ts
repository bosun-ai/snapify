import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import ts from 'typescript';

const DOC_TARGETS = [
  'src/render.ts',
  'src/core/templateAssembler.ts',
  'src/core/snapshotRunner.ts',
  'src/core/diagnostics.ts',
  'src/types.ts'
].map((p) => path.resolve(p));

function hasJsDoc(node: ts.Node, sf: ts.SourceFile) {
  const text = sf.getFullText();
  const start = node.getStart(sf, /*includeJsDocComment*/ false);
  const docStart = text.lastIndexOf('/**', start);
  if (docStart === -1) return false;
  const docEnd = text.indexOf('*/', docStart);
  if (docEnd === -1 || docEnd > start) {
    return false;
  }
  const between = text.slice(docEnd + 2, start);
  return /^\s*$/.test(between);
}

function isExported(node: ts.Node) {
  return Boolean(node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
}

function isDocTarget(node: ts.Node): node is ts.ClassDeclaration | ts.FunctionDeclaration | ts.InterfaceDeclaration | ts.TypeAliasDeclaration {
  return ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node);
}

test('public API exports carry JSDoc', () => {
  const program = ts.createProgram(DOC_TARGETS, { allowJs: false, strict: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext });
  const missing: string[] = [];

  for (const sf of program.getSourceFiles()) {
    if (!DOC_TARGETS.includes(path.resolve(sf.fileName))) continue;
    ts.forEachChild(sf, function walk(node) {
      if (isExported(node) && isDocTarget(node)) {
        if (!hasJsDoc(node, sf)) {
          const name = node.name && ts.isIdentifier(node.name) ? node.name.text : '<anonymous>';
          missing.push(`${sf.fileName}:${name}`);
        }
      }
      ts.forEachChild(node, walk);
    });
  }

  assert.deepEqual(missing, [], `Missing JSDoc on exported declarations: ${missing.join(', ')}`);
});
