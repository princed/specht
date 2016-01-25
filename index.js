var https = require('https');
var fs = require('fs');

var readdirp = require('readdirp');
var es = require('event-stream');
var escapeStringRegexp = require('escape-string-regexp');
var through2 = require('through2');
var parse5 = require('parse5');

var argv = require('yargs').usage('Usage: $0 [options]').demand(['prefix', 'paths']).describe('prefix', 'Help site prefix, like: https://www.jetbrains.com/hub/help/1.0/').describe('paths', 'Comma-delimited root paths, like: relative-path,/absolute/path/').default('filter', '*.{html,js}').default('html-extension', '.html').help('h').alias('h', 'help').argv;

var pages = Object.create(null);
var rootList = argv.paths.split(',');
var rootStream = rootList.map(function mapRootList(root) {
  return readdirp({
    root: root,
    fileFilter: argv.fileFilter
  });
});

var docUrlPattern = new RegExp(escapeStringRegexp(argv.prefix) + '[a-z0-9-]+' + escapeStringRegexp(argv.htmlExtension), 'ig');
function buildDocUrl(id) {
  return argv.prefix + id + argv.htmlExtension;
}

function getUrls(entry, enc, pipeCallback) {
  var fileStream = this; // eslint-disable-line consistent-this
  var htmlParser = new parse5.SAXParser();

  function emitUrl(url) {
    if (!pages[url]) {
      fileStream.push(url);
      pages[url] = true;
    }
  }

  htmlParser.on('startTag', function onStartTag(name, attrs) {
    if (name === 'hub-page-help-link') {
      attrs.forEach(function eachAttr(attr) {
        if (attr.name === 'url') {
          emitUrl(buildDocUrl(attr.value));
        }
      });
    }
  });

  htmlParser.on('end', pipeCallback);

  var grep = through2(function grep(content, grepEnc, grepCallback) { // eslint-disable-line vars-on-top
    var matches = content.toString().match(docUrlPattern);

    if (matches) {
      matches.forEach(emitUrl);
    }

    grepCallback(null, content);
  });

  fs.
    createReadStream(entry.fullPath, {encoding: 'utf-8'}).
    pipe(grep).
    pipe(htmlParser);
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
    pipe(through2(checkUrls));
}
