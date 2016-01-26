#!/usr/bin/env node

var path = require('path');
var https = require('https');
var fs = require('fs');

var readdirp = require('readdirp');
var es = require('event-stream');
var escapeStringRegexp = require('escape-string-regexp');
var through2 = require('through2');
var parse5 = require('parse5');
var gitIgnoreParser = require('gitignore-parser');

var babylon = require('babylon');
var traverse = require('babel-traverse').default;
var types = require('babel-types');

var argv = require('yargs').
  usage('Usage: $0 [path] [options]').
  demand(['prefix']).
  describe('prefix', 'Help site prefix, like: https://www.jetbrains.com/hub/help/1.0/').
  default('filter', '*.{html,js}').
  default('html-extension', '.html').
  help('h').
  alias('h', 'help').
  alias('f', 'filter').
  alias('e', 'html-extension').
  argv;

var startTime = Date.now();
var pages = Object.create(null);
var directoryFilter;
try {
  var gitignore = gitIgnoreParser.compile(fs.readFileSync('.gitignore', 'utf8'));
  directoryFilter = function (entry) {
    return gitignore.accepts(entry.path);
  };
} catch (e) {
  directoryFilter = function () {
    return true;
  };
}

var rootStream = readdirp({
  root: process.cwd() || argv._[0],
  directoryFilter: directoryFilter,
  fileFilter: argv.filter
});

function buildDocUrl(id) {
  return argv.prefix + id + argv.htmlExtension;
}

function parseJS(code, emitDocument, stopCallback) {
  var ast = babylon.parse(code);
  var argumentPosition = 0;
  var functionName = 'getHelpUrlFilter';

  traverse(ast, {
    enter: function(path) {
      if (
        types.isCallExpression(path.node) &&
        types.isIdentifier(path.node.callee, {name: functionName})
      ) {
        var arg = path.node.arguments[argumentPosition];

        if (types.isStringLiteral(arg)) {
          emitDocument(arg.value);
        } else if (types.isIdentifier(arg)) {
          var binding = path.scope.getBinding(arg.name);

          if (binding &&
            types.isVariableDeclarator(binding.path.node) &&
            types.isStringLiteral(binding.path.node.init)
          ) {
            emitDocument(binding.path.node.init.value);
          }
        }
      }
    }
  });

  stopCallback();
}

function getUrls(entry, enc, stopCallback) {
  var entryStream = this; // eslint-disable-line consistent-this
  var htmlParser = new parse5.SAXParser();

  function emitDocument(url) {
    if (!pages[url]) {
      entryStream.push(buildDocUrl(url));
      pages[url] = true;
    }
  }

  htmlParser.on('startTag', function onStartTag(name, attrs) {
    if (name === 'hub-page-help-link') {
      attrs.forEach(function eachAttr(attr) {
        if (attr.name === 'url') {
          emitDocument(attr.value);
        }
      });
    }
  });

  htmlParser.on('end', stopCallback);

  if (path.extname(entry.name) === argv.htmlExtension) {
    fs.
      createReadStream(entry.fullPath, {encoding: 'utf-8'}).
      pipe(htmlParser);
  } else if (path.extname(entry.name) === '.js') {
    fs.readFile(entry.fullPath, {encoding: 'utf-8'}, function (err, content) {
      if (err) {
        return stopCallback(err);
      }

      parseJS(content.toString(), emitDocument, stopCallback);
    })
  } else {
    stopCallback();
  }
}

function checkUrls(url, enc, checkCallback) {
  var urlString = url.toString();

  https.
    get(urlString, function success(res) {
      console.log('Got response: ' + res.statusCode, urlString);
      checkCallback(null, url);
    }).
    on('error', function error(e) {
      console.log('Got error: ' + e.message);
      checkCallback(null, url);
    });
}

if (!argv.help) {
  es.merge(rootStream).
    pipe(through2.obj(getUrls)).
    pipe(through2(checkUrls)).
    on('finish', function countTime() {
      var ms = 1000;
      console.log('Check finished in ' + (Date.now() - startTime) / ms + 's');
    });
}
