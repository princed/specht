import {readFile} from 'fs';

import {parse} from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';

function parseCode(code, rules, emitDocument) {
  const ast = parse(code, {
    sourceType: 'module'
  });

  traverse(ast, {
    enter: path => {
      if (!t.isCallExpression(path.node) || !t.isIdentifier(path.node.callee)) {
        return;
      }
      const argumentPosition = rules.get(path.node.callee.name);

      if (!isNaN(argumentPosition)) {
        const argument = path.node.arguments[argumentPosition];

        if (t.isStringLiteral(argument)) {
          emitDocument(argument.value);

        } else if (t.isIdentifier(argument)) {
          const binding = path.scope.getBinding(argument.name);
          const node = binding && binding.path.node;

          if (node && t.isVariableDeclarator(node) && t.isStringLiteral(node.init)) {
            emitDocument(node.init.value);
          }
        }
      }
    }
  });
}

export default function parseJS(path, rules, emitDocument, stopCallback) {
  readFile(path, {encoding: 'utf-8'}, (err, content) => {
    if (err) {
      return stopCallback(err);
    }

    parseCode(content.toString(), rules, emitDocument);
    stopCallback();
  });
}
