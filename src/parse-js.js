import {readFile} from 'fs';

import {parse} from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';

function parseCode(code, rules, push) {
  const errors = [];
  const ast = parse(code, {
    sourceType: 'module'
  });

  traverse(ast, {
    enter: path => {
      if (!t.isCallExpression(path.node) || !t.isIdentifier(path.node.callee)) {
        return;
      }

      const name = path.node.callee.name;
      const argumentPosition = rules.get(name);

      if (!isNaN(argumentPosition)) {
        const argument = path.node.arguments[argumentPosition];

        if (t.isStringLiteral(argument)) {
          push(argument.value);

        } else if (t.isIdentifier(argument)) {
          const binding = path.scope.getBinding(argument.name);
          const node = binding && binding.path.node;

          if (node && t.isVariableDeclarator(node) && t.isStringLiteral(node.init)) {
            push(node.init.value);
          } else {
            errors.push({name, pos: argument.loc.start});
          }
        }
      }
    }
  });

  return errors;
}

export default function parseJS({fullPath, rules, push, next}) {
  readFile(fullPath, {encoding: 'utf-8'}, (err, content) => {
    if (err) {
      return next(err);
    }

    const [error] = parseCode(content.toString(), rules, push);
    if (error) {
      const {name, pos: {column, line}} = error;
      // Mimic real stacktrace to make it clickable in IDE
      return next(new Error(`Function ${name} have undetectable arguments\n    at ${fullPath}:${line}:${column}`));
    }

    next();
  });
}
