#!/usr/bin/env node

import https from 'https';
import fs from 'fs';
import {extname} from 'path';

import readdirp from 'readdirp';
import through2 from 'through2';
import gitIgnoreParser from 'gitignore-parser';
import yargs from 'yargs';

import parseJS from './parse-js';
import parseHTML from './parse-html';

const argv = yargs.
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

const startTime = Date.now();
const pages = Object.create(null);
let directoryFilter;
try {
  const gitignore = gitIgnoreParser.compile(fs.readFileSync('.gitignore', 'utf8'));
  directoryFilter = entry => gitignore.accepts(entry.path);
} catch (e) {
  directoryFilter = () => true;
}

const rootStream = readdirp({
  root: process.cwd() || argv._[0],
  directoryFilter,
  fileFilter: argv.filter
});

function buildDocUrl(id) {
  return argv.prefix + id + argv.htmlExtension;
}

function getUrls(entry, enc, stopCallback) {
  const emitDocument = url => {
    if (!pages[url]) {
      this.push(buildDocUrl(url));
      pages[url] = true;
    }
  };

  if (extname(entry.name) === argv.htmlExtension) {
    parseHTML(entry.fullPath, emitDocument, stopCallback);
  } else if (extname(entry.name) === '.js') {
    parseJS(entry.fullPath, emitDocument, stopCallback);
  } else {
    stopCallback();
  }
}

function checkUrls(url, enc, checkCallback) {
  https.
    get(url, ({statusCode}) => {
      checkCallback(null, {statusCode, url});
    }).
    on('error', checkCallback);
}

if (!argv.help) {
  rootStream.
    pipe(through2.obj(getUrls)).
    pipe(through2.obj(checkUrls)).
    on('data', res => {
      console.log(`Got response: ${res.statusCode}`, res.url);
    }).
    on('finish', () => {
      const ms = 1000;
      console.log(`Finished in ${(Date.now() - startTime) / ms} s`);
    });
}
