/* eslint import/no-extraneous-dependencies:0 import/imports-first:0, no-use-before-define:0*/
import test from 'ava';
import createRunner from '../src/runner';
import mock from 'mock-fs';
import sinon from 'sinon';
import enableHackForMockFs from './enable-hack-for-mock-fs';
import fs from 'fs';


let restore;
test.before(() => {
  mock({
    '/foo': {
      'bar.js': 'zoo("zooTestUrlFromJs"); moo(null, "mooTestUrlFromJs");'
    }
  });

  restore = enableHackForMockFs(fs);
});

test.after.always(() => {
  mock.restore();
  restore();
});


let runner;
test.beforeEach(() => {
  runner = createRunner({});
});


test.cb('should get links from javascript file', (t) => {
  sinon.stub(runner, 'checkUrls', (document) => {
    t.is(document, 'zooTestUrlFromJs');
    t.pass();
    t.end();
  });


  runner.start({
    rootDir: '/foo',
    jsExtension: ['.js'],
    jsRules: ['zoo:0']
  });
});


test.cb('should allow pass custom argument position', (t) => {
  sinon.stub(runner, 'checkUrls', (document) => {
    t.is(document, 'mooTestUrlFromJs');
    t.pass();
    t.end();
  });


  runner.start({
    rootDir: '/foo',
    jsExtension: ['.js'],
    jsRules: ['moo:1']
  });
});


test.cb('should request url', (t) => {
  const link = 'mooTestUrlFromJs';
  const baseUrl = 'http://foo';

  const pattern = `${baseUrl}/%s`;
  const expectedUrl = `${baseUrl}/${link}`;

  sinon.stub(runner, 'requestUrl', (url, onSuccess, onError) => {
    t.is(url, expectedUrl);
    t.is(typeof onSuccess, 'function');
    t.is(typeof onError, 'function');

    t.pass();
    t.end();
  });


  runner.start({
    rootDir: '/foo',
    pattern,
    jsExtension: ['.js'],
    jsRules: ['moo:1']
  });
});


// Tests for Reporters
test('should call consoleReporter', (t) => {
  const consoleReporter = runner.reporters.console;
  sinon.stub(consoleReporter, 'printMessage');

  runner.onTestResult({});

  t.is(consoleReporter.printMessage.called, true);
});


test('should call teamcityReporter', (t) => {
  const teamcityReporter = runner.reporters.teamcity;
  sinon.stub(teamcityReporter, 'onTestResult');

  runner.updateConfig({teamcity: true});
  runner.onTestResult({});

  t.is(teamcityReporter.onTestResult.called, true);
});


// Tests on hooks
test('should allow add hook which prevent check url', (t) => {
  const next = sinon.spy();

  runner.updateConfig({
    pattern: '%s',
    beforeCheckUrl: (url) => url !== 'foo'
  });
  sinon.stub(runner, 'requestUrl');

  runner.checkUrls('foo', {next});

  t.is(runner.requestUrl.called, false);
  t.is(next.called, true);
});
