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
  demand(['prefix', 'html-rules', 'js-rules']).
  describe('prefix', 'Help site prefix, like: https://www.jetbrains.com/hub/help/1.0/').
  default('ignore-file', '.gitignore').
  describe('ignore-file', 'File of ignores to be used as filter of directories').
  default('filter', '*.{html,js}').
  describe('filter', 'Glob pattern to match files').
  array('html-rules').
  describe('html-rules', 'Rules of parsing JavaScript files, in form of <function name>[:<argument number, default is 0>]. Could be used more than once').
  array('js-rules').
  describe('js-rules', 'Rules of parsing HTML files, in form of <tag name>:<attribute name>. Could be used more than once').
  default('html-extension', '.html').
  describe('html-extension', 'Extensions of JavaScript files, could be used more than once').
  default('js-extension', '.js').
  describe('js-extension', 'Extensions of HTML files, could be used more than once').
  help('help').
  argv;

const startTime = Date.now();
const pages = new Set();
const langProps = new Map();

const jsExtension = Array.isArray(argv.jsExtension) ? argv.jsExtension : [argv.jsExtension];
const htmlExtension = Array.isArray(argv.htmlExtension) ? argv.htmlExtension : [argv.htmlExtension];

const RULE_DELIMITER = ':';
function convertRules(rules, defaultValue) {
  const lookup = new Map();

  rules.forEach(rule => {
    const [key, ...ruleParts] = rule.split(RULE_DELIMITER);

    switch (ruleParts.length) {
      case 0:
        if (defaultValue == null) {
          throw new Error(`Attribute name for tag “${key}” is expected.`);
        }
        lookup.set(key, defaultValue);
        break;

      case 1:
        lookup.set(key, ruleParts[0]);
        break;

      case 2:
        lookup.set(key + RULE_DELIMITER + ruleParts[0], ruleParts[1]);
        break;

      default:
        throw new Error(`Rule must contain maximum 2 delimiters (${RULE_DELIMITER})`);
    }
  });

  return lookup;
}
const htmlParams = {parser: parseJS, rules: convertRules(argv.jsRules, 0)};
const jsParams = {parser: parseHTML, rules: convertRules(argv.htmlRules)};
jsExtension.forEach(ext => langProps.set(ext, htmlParams));
htmlExtension.forEach(ext => langProps.set(ext, jsParams));

function getUrls(entry, enc, stopCallback) {
  const params = langProps.get(extname(entry.name));
  const emitDocument = url => {
    if (!pages.has(url)) {
      this.push(`${argv.prefix}${url}.html`);
      pages.add(url);
    }
  };

  if (params) {
    params.parser(entry.fullPath, params.rules, emitDocument, stopCallback);
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
