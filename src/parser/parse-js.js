import {readFile} from 'fs';

import {parse} from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';

export function parseCode(code, rules, push) {
  const errors = [];
  const ast = parse(code, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'flow',
      'asyncFunctions',
      'classConstructorCall',
      'doExpressions',
      'trailingFunctionCommas',
      'objectRestSpread',
      'decorators',
      'classProperties',
      'exportExtensions',
      'exponentiationOperator',
      'asyncGenerators',
      'functionBind',
      'functionSent'
    ]
  });

  function addError(name, argument) {
    errors.push({name, pos: argument.loc.start});
    return errors;
  }

  function getBinding(path, argument) {
    const binding = path.scope.getBinding(argument.name);
    return binding && binding.path.node;
  }

  function getVarValue(path, argument) {
    if (!t.isIdentifier(argument)) {
      return false;
    }

    const node = getBinding(path, argument);
    return node && t.isVariableDeclarator(node) && node.init;
  }

  function getLiteral(path, node) {
    return t.isIdentifier(node) ? getVarValue(path, node) : node;
  }

  function createContext(path) {
    const node = path.node;
    return {
      args: () =>
        node.arguments.map(getLiteral.bind(null, path)).filter(it => it).map(it => it.value)
    };
  }

  traverse(ast, {
    enter: (path) => {
      if (
        !t.isCallExpression(path.node) ||
        !t.isIdentifier(path.node.callee)
      ) {
        return;
      }

      const name = path.node.callee.name;
      const argumentPosition = rules.get(name);

      if (isNaN(argumentPosition)) {
        return;
      }

      const argument = path.node.arguments[argumentPosition];
      const argValue = getLiteral(path, argument);

      if (t.isStringLiteral(argValue)) {
        push(argument.value, createContext(path));
        return;
      }

      addError(name, argument);
    }
  });

  return errors;
}

export default function parseJS({fullPath, rules, push, next}) {
  readFile(fullPath, {encoding: 'utf-8'}, (err, content) => {
    if (err) {
      next(err);
      return;
    }

    let errors;

    try {
      errors = parseCode(content.toString(), rules, push);
    } catch (e) {
      const {message, loc: {column, line}} = e;
      next(new Error(`Babel parsing error: ${message}\n    at ${fullPath}:${line}:${column}`));
      return;
    }

    if (errors[0]) {
      const {name, pos: {column, line}} = errors[0];
      // Mimic real stacktrace to make it clickable in IDE
      next(new Error(`Function ${name} have undetectable arguments\n    at ${fullPath}:${line}:${column}`));
      return;
    }

    next();
  });
}
