import {readFile} from 'fs';

import {parse} from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';

function parseCode(code, emitDocument) {
  const ast = parse(code, {
    sourceType: 'module'
  });
  const argumentPosition = 0;
  const functionName = 'getHelpUrlFilter';

  traverse(ast, {
    enter: path => {
      if (
        t.isCallExpression(path.node) &&
        t.isIdentifier(path.node.callee, {name: functionName})
      ) {
        const arg = path.node.arguments[argumentPosition];

        if (t.isStringLiteral(arg)) {
          emitDocument(arg.value);

        } else if (t.isIdentifier(arg)) {
          const binding = path.scope.getBinding(arg.name);
          if (binding &&
            t.isVariableDeclarator(binding.path.node) &&
            t.isStringLiteral(binding.path.node.init)
          ) {
            emitDocument(binding.path.node.init.value);
          }
        }
      }
    }
  });
}

export default function parseJS(path, emitDocument, stopCallback) {
  readFile(path, {encoding: 'utf-8'}, (err, content) => {
    if (err) {
      return stopCallback(err);
    }

    parseCode(content.toString(), emitDocument);
    stopCallback();
  });
}
