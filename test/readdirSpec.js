/* eslint import/no-extraneous-dependencies:0 import/imports-first:0, no-use-before-define:0*/
import test from 'ava';
import readdir from '../src/readdir';
import mock from 'mock-fs';
import enableHackForMockFs from './enable-hack-for-mock-fs';


let restore;
let rootDir;
test.beforeEach(() => {
  rootDir = '/foo';

  const testFs = mock.fs({
    '/foo': {
      'bar.js': 'zoo("test")'
    }
  });

  restore = enableHackForMockFs(testFs);
});


test.afterEach.always(() => {
  restore();
});


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

