import path from 'node:path';

import ts from 'typescript';
import { expect, test } from 'vitest';

test('PR250 keeps contribution locations and existing grid children structurally separate', () => {
  const program = ts.createProgram(
    [path.resolve('src/tests/type-fixtures/gridLocationIsolation.ts')],
    {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      esModuleInterop: true,
      types: ['react'],
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Node10,
    },
  );
  const diagnostics = ts.getPreEmitDiagnostics(program);
  expect(
    diagnostics.map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    ),
  ).toEqual([]);
});
