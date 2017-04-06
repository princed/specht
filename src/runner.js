import 'babel-polyfill';

import {extname} from 'path';
import https from 'https';
import http from 'http';
import {format} from 'util';

import parseJS from './parser/parse-js';
import parseHTML from './parser/parse-html';
import readdir from './readdir';
import convertRules from './convert-rules';
import ConsoleReporter from './reporter/console';
import TeamcityReporter from './reporter/teamcity';


export default function createRunner() {
  function runner() {

  }

  runner.langProps = new Map();
  runner.documents = new Map();

  runner.reporters = {
    console: new ConsoleReporter(),
    teamcity: new TeamcityReporter()
  };

  runner.config = {
    rootDir: '',
    pattern: '',

    htmlExtension: [],
    htmlRules: [],

    jsExtension: [],
    jsRules: [],

    ignoreFile: '',
    maxConcurrency: 1,
    teamcity: false,

    beforeCheckUrl: url => url
  };


  runner.start = function start(params = {}) {
    const {htmlExtension, jsExtension, htmlRules, jsRules, rootDir, ignoreFile, maxConcurrency} = runner.updateConfig(params);

    const htmlParams = {parser: parseHTML, rules: convertRules(htmlRules)};
    htmlExtension.forEach(ext => runner.langProps.set(ext, htmlParams));

    const jsParams = {parser: parseJS, rules: convertRules(jsRules, 0)};
    jsExtension.forEach(ext => runner.langProps.set(ext, jsParams));


    runner.onStart();
    readdir.read(rootDir, {
      ignoreFile,
      maxConcurrency,
      extensions: [].concat(htmlExtension).concat(jsExtension),

      onReadFile: runner.getUrls,
      onReadDocument: runner.checkUrls,
      onTestResult: runner.onTestResult,
      onFinish: runner.onFinish
    });
  };


  runner.updateConfig = (params) => {
    Object.assign(runner.config, params);
    return runner.config;
  };


  runner.getUrls = function getUrls(fullPath, {next, push}) {
    const {rules, parser} = runner.langProps.get(extname(fullPath)) || {};
    const documents = runner.documents;

    const onFindDocumentLink = (document) => {
      if (!documents.has(document)) {
        push(document);
        documents.set(document, fullPath);
      }
    };

    if (parser) {
      parser({fullPath, rules, push: onFindDocumentLink, next});
    } else {
      next();
    }
  };


  runner.checkUrls = function checkUrls(document, {next}) {
    if (!document) {
      next();
      return;
    }

    const pattern = runner.config.pattern;
    const beforeCheckUrl = runner.config.beforeCheckUrl;
    const url = beforeCheckUrl(format(pattern, document));

    if (!url) {
      next();
      return;
    }

    runner.requestUrl(url, ({statusCode}) => next(null, {statusCode, url, document}), next);
  };


  runner.requestUrl = (url, onSuccess, onError) => {
    const handlers = {http, https};
    const [protocol] = url.split('://');
    const handler = handlers[protocol];

    if (!handler) {
      throw new Error(`Protocol “${protocol}” from url “${url}” is not supported.`);
    }

    return handler.get(url, onSuccess).on('error', onError);
  };

  runner.onTestResult = ({statusCode, url, document}) => {
    const teamcity = runner.config.teamcity;
    const consoleReporter = runner.reporters.console;
    const teamcityReporter = runner.reporters.teamcity;
    const result = {
      document,
      statusCode,
      url,
      sourceFilePath: runner.documents.get(document)
    };

    if (teamcity) {
      teamcityReporter.onTestResult(result);
      return;
    }

    consoleReporter.onTestResult(result);
  };


  runner.onStart = () => {
    runner.startTime = Date.now();
  };


  runner.onFinish = () => {
    const ms = 1000;
    // eslint-disable-next-line no-console
    console.log(`Finished in ${(Date.now() - runner.startTime) / ms}s`);
  };

  return runner;
}
