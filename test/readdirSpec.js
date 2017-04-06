/* eslint import/no-extraneous-dependencies:0 import/imports-first:0, no-use-before-define:0*/
import mock from 'mock-fs';
import test from 'ava';

import readdir from '../src/readdir';

const rootDir = '/foo';

test.beforeEach(() => {
  mock({
    '/foo': {
      'bar.js': 'zoo("test")'
    }
  });
});


test.afterEach.always(mock.restore);


test.cb('should call on onReadFile', (t) => {
  readdir.read(rootDir, {
    onReadFile: () => {
      t.pass();
      t.end();
    }
  });
});


test.cb('should call onReadDocument after onReadFile', (t) => {
  readdir.read(rootDir, {
    onReadFile: onReadFileStub,
    onReadDocument: () => {
      t.pass();
      t.end();
    }
  });
});


test.cb('should call onTestResult after onReadFile', (t) => {
  readdir.read(rootDir, {
    onReadFile: onReadFileStub,
    onReadDocument: onReadDocumentStub,
    onTestResult: () => {
      t.pass();
      t.end();
    }
  });
});


test.cb('should call onFinish after all', (t) => {
  readdir.read(rootDir, {
    onReadFile: onReadFileStub,
    onReadDocument: onReadDocumentStub,
    onFinish: () => {
      t.pass();
      t.end();
    }
  });
});


function onReadFileStub(file, {next}) {
  next(null, file);
}


function onReadDocumentStub(document, {next}) {
  next(null, document);
}

