#!/usr/bin/env node
import 'babel-polyfill';

import https from 'https';
import http from 'http';
import {format} from 'util';
import {resolve, extname} from 'path';

import readdirp from 'readdirp';
import through2 from 'through2';
import ignore from 'ignore-file';
import yargs from 'yargs';
import {testStarted, testFinished, testFailed} from 'teamcity-service-messages';

import parseJS from './parse-js';
import parseHTML from './parse-html';

const {
  pattern,
  jsExtension,
  htmlExtension,
  jsRules,
  htmlRules,
  ignoreFile,
  help,
  teamcity,
  _: [root = process.cwd()]
} = yargs.
  usage(`Usage: $0 [path] [options]

Example: $0 client-side \\
--pattern https://www.jetbrains.com/hub/help/1.0/%s.html \\
--ignore-file .gitignore \\
--html-rules svg:xlink:href hub-page-help-link:url \\
--js-rules getHelpUrlFilter getSome:1 \\
--html-extension .html .htm \\
--teamcity`).
  option('pattern', {
    describe: 'Help site pattern, like: https://www.jetbrains.com/hub/help/1.0/%s.html',
    demand: true
  }).
  option('ignore-file', {
    describe: 'Files and directories to ignore, uses .gitgnore format. Relative from path.'
  }).
  option('html-rules', {
    describe: 'Rules of parsing JavaScript files, in form of <function name>[:<argument number, default is 0>].',
    array: true,
    demand: true
  }).
  option('js-rules', {
    describe: 'Rules of parsing HTML files, in form of <tag name>:<attribute name>. XML namespaces for attributes are supported.',
    array: true,
    demand: true
  }).
  option('html-extension', {
    describe: 'Extensions of HTML files',
    array: true,
    default: ['.html']
  }).
  option('js-extension', {
    describe: 'Extensions of JavaScript files',
    array: true,
    default: ['.js']
  }).
  option('teamcity', {
    describe: 'Report check results to TeamCity',
    boolean: true
  }).
  help('help').
  argv;

const startTime = Date.now();
const pages = new Set();
const langProps = new Map();
const SUCCESS_CODE = 200;

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

      // Support attributes with namespaces
      case 2:
        lookup.set(key, ruleParts.join(RULE_DELIMITER));
        break;

      default:
        throw new Error(`Rule must contain maximum 2 delimiters (${RULE_DELIMITER})`);
    }
  });

  return lookup;
}

const htmlParams = {parser: parseJS, rules: convertRules(jsRules, 0)};
const jsParams = {parser: parseHTML, rules: convertRules(htmlRules)};
jsExtension.forEach(ext => langProps.set(ext, htmlParams));
htmlExtension.forEach(ext => langProps.set(ext, jsParams));

function getUrls({name, fullPath}, enc, next) {
  const {rules, parser} = langProps.get(extname(name)) || {};
  const push = url => {
    if (!pages.has(url)) {
      this.push(format(pattern, url));
      pages.add(url);
    }
  };

  if (parser) {
    parser({fullPath, rules, push, next});
  } else {
    next();
  }
}

const handlers = {http, https};
function checkUrls(url, enc, next) {
  const [protocol] = url.split('://');
  const handler = handlers[protocol];

  if (!handler) {
    throw new Error(`Protocol “${protocol}” from url “${url}” is not supported.`);
  }

  handler.
    get(url, ({statusCode}) => {
      next(null, {statusCode, url});
    }).
    on('error', next);
}

function getFilters(callback) {
  const extensions = [...htmlExtension, ...jsExtension];
  const filterByExtension = entry => extensions.includes(extname(entry.name));

  if (!ignoreFile) {
    return callback(filterByExtension);
  }

  ignore(resolve(root, ignoreFile), (err, filter) => {
    if (err) {
      throw err;
    }

    const fileFilter = entry => filterByExtension(entry) && !filter(entry.path);
    const directoryFilter = entry => !filter(entry.path);

    callback(fileFilter, directoryFilter);
  });
}

function start(fileFilter, directoryFilter) {
  readdirp({root, fileFilter, directoryFilter}).
    pipe(through2.obj(getUrls)).
    pipe(through2.obj(checkUrls)).
    on('data', ({statusCode, url}) => {
      if (teamcity) {
        testStarted({name: url});

        if (statusCode !== SUCCESS_CODE) {
          testFailed({name: url, message: `Got response ${statusCode}`});
        }
        testFinished({name: url});
      } else {
        console.log(`Got response ${statusCode} from ${url}`);
      }
    }).
    on('finish', () => {
      const ms = 1000;
      console.log(`Finished in ${(Date.now() - startTime) / ms}s`);
    });
}

if (!help) {
  getFilters(start);
}
