#!/usr/bin/env node
import 'babel-polyfill';
import yargs from 'yargs';
import createRunner from './runner';

const {
  pattern,
  jsExtension,
  htmlExtension,
  jsRules,
  htmlRules,
  ignoreFile,
  maxConcurrency,
  help,
  teamcity,
  _: [rootDir = process.cwd()]
} = yargs.
usage(`Usage: $0 [path] [options]

Example: $0 path/to/start/from \\
--pattern https://www.jetbrains.com/hub/help/1.0/%s.html \\
--ignore-file .gitignore \\
--html-rules svg:xlink:href hub-page-help-link:url \\
--js-rules getHelpUrlFilter getHelpUrlInSecondParameter:1 \\
--html-extension .html .htm \\
--teamcity

At least one of --js-rules or --html-rules parameters is required. Will exit with code 1 otherwise.`).
option('pattern', {
  describe: 'Help site pattern, e.g.: https://www.jetbrains.com/hub/help/1.0/%s.html. “%s” placeholder is replaced with parts found by parsers',
  default: '%s'
}).
option('ignore-file', {
  describe: 'Files and directories to ignore, uses .gitgnore format. Relative from path.'
}).
option('html-rules', {
  describe: 'Rules of parsing HTML files, in form of <tag name>:<attribute name>. XML namespaces for attributes are supported.',
  array: true
}).
option('js-rules', {
  describe: 'Rules of parsing JavaScript files, in form of <function name>[:<argument number, default is 0>].',
  array: true
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
option('max-concurrency', {
  describe: 'Maximal number of files being processed and requests being sent concurrently'
}).
help('help').
  argv;

if (!help) {
  if (!jsRules && !htmlRules) {
    throw new Error('No search rules have been provided');
  }

  const runner = createRunner();

  runner.start({
    rootDir,
    pattern,
    ignoreFile,
    maxConcurrency,
    teamcity,
    htmlExtension,
    htmlRules,
    jsExtension,
    jsRules
  });
}
