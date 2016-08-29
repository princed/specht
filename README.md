Specht
======

[![Dependency Status](https://img.shields.io/david/princed/specht.svg?style=flat-square)](https://david-dm.org/princed/specht) [![Current version](https://img.shields.io/npm/v/specht.svg?style=flat-square)](https://www.npmjs.com/package/specht) [![Travis Build Status](https://img.shields.io/travis/princed/specht.svg?style=flat-square)](https://travis-ci.org/princed/specht)

## Installation

```
$ npm install specht --save
```

## Usage

### CLI

```sh
$ specht --help

Usage: specht [path] [options]

Example: specht path/to/start/from \
--pattern https://www.jetbrains.com/hub/help/1.0/%s.html \
--ignore-file .gitignore \
--html-rules svg:xlink:href hub-page-help-link:url \
--js-rules getHelpUrlFilter getHelpUrlInSecondParameter:1 \
--html-extension .html .htm \
--teamcity

At least one of --js-rules or --html-rules parameters is required. Will exit
with code 1 otherwise.

Options:
  --pattern         Help site pattern, e.g.:
                    https://www.jetbrains.com/hub/help/1.0/%s.html. “%s”
                    placeholder is replaced with parts found by parsers
                                                                 [default: "%s"]
  --ignore-file     Files and directories to ignore, uses .gitgnore format.
                    Relative from path.
  --html-rules      Rules of parsing HTML files, in form of <tag
                    name>:<attribute name>. XML namespaces for attributes are
                    supported.                                           [array]
  --js-rules        Rules of parsing JavaScript files, in form of <function
                    name>[:<argument number, default is 0>].             [array]
  --html-extension  Extensions of HTML files        [array] [default: [".html"]]
  --js-extension    Extensions of JavaScript files    [array] [default: [".js"]]
  --teamcity        Report check results to TeamCity                   [boolean]
  --help            Show help                                          [boolean]
```

### Programmatic 

See fields descriptions above, however there is no defaults.

```js
import createRunner from 'specht';

const runner = createRunner();

runner.start({
 rootDir,
 pattern,  
 ignoreFile,
 teamcity,
 htmlExtension,
 htmlRules,
 jsExtension,
 jsRules
});
```
