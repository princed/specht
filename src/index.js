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
  default('ignore-file', '.gitignore').
  describe('ignore-file', 'File of ignores to be used as filter of directories').
  default('filter', '*.{html,js}').
  describe('filter', 'Glob pattern to match files').
  default('html-extension', '.html').
  describe('html-extension', 'Extensions of JavaScript files, could be used more than once').
  default('js-extension', '.js').
  describe('js-extension', 'Extensions of HTML files, could be used more than once').
  help('help').
  argv;

const startTime = Date.now();
const pages = new Set();
const parserLookup = new Map();

const jsExtension = Array.isArray(argv.jsExtension) ? argv.jsExtension : [argv.jsExtension];
const htmlExtension = Array.isArray(argv.htmlExtension) ? argv.htmlExtension : [argv.htmlExtension];
jsExtension.forEach(ext => parserLookup.set(ext, parseJS));
htmlExtension.forEach(ext => parserLookup.set(ext, parseHTML));

function getUrls(entry, enc, stopCallback) {
  const parser = parserLookup.get(extname(entry.name));
  const emitDocument = url => {
    if (!pages.has(url)) {
      this.push(`${argv.prefix}${url}.html`);
      pages.add(url);
    }
  };

  if (parser) {
    parser(entry.fullPath, emitDocument, stopCallback);
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
  let directoryFilter;
  try {
    const gitignore = gitIgnoreParser.compile(fs.readFileSync(argv.ignoreFile, 'utf8'));
    directoryFilter = entry => gitignore.accepts(entry.path);
  } catch (e) {
    // noop
  }

  readdirp({
    root: process.cwd() || argv._[0],
    directoryFilter,
    fileFilter: argv.filter
  }).
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
