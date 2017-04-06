import mock from 'mock-fs';

import test from 'ava';
import sinon from 'sinon';

import createRunner from '../src/runner';

test.before(() => {
  mock({
    '/foo': {
      'bar.js': 'zoo("zooTestUrlFromJs"); moo(null, "mooTestUrlFromJs");'
    }
  });
});

test.after.always(mock.restore);

let runner;
test.beforeEach(() => {
  runner = createRunner({});
});


test.cb('should get links from javascript file', (t) => {
  sinon.stub(runner, 'checkUrls').callsFake((document) => {
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
  sinon.stub(runner, 'checkUrls').callsFake((document) => {
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

  sinon.stub(runner, 'requestUrl').callsFake((url, onSuccess, onError) => {
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
    beforeCheckUrl: url => url !== 'foo'
  });
  sinon.stub(runner, 'requestUrl');

  runner.checkUrls('foo', {next});

  t.is(runner.requestUrl.called, false);
  t.is(next.called, true);
});
