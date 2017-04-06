import through2Concurrent from 'through2-concurrent';
import readdir from 'readdir-enhanced';
import ignore from 'ignore-file';
import {resolve, extname} from 'path';

function getIgnoreFilters({rootDir, extensions = [], ignoreFile = ''}) {
  let filterByExtension = () => true;

  if (extensions.length) {
    filterByExtension = entry => extensions.includes(extname(entry.path));
  }

  if (!ignoreFile) {
    return filterByExtension;
  }

  const filter = ignore.sync(resolve(rootDir, ignoreFile));

  return entry => !filter(entry.path) && (!entry.isFile() || filterByExtension(entry));
}

export default {
  read: (rootDir, {extensions, ignoreFile, maxConcurrency, onReadFile, onReadDocument, onTestResult, onFinish}) => {
    function callOnFileHandler(fileInfo, encode, next) {
      if (onReadFile) {
        onReadFile(fileInfo, {
          next,
          push: this.push.bind(this)
        });
      }
    }

    function callOnReadDocument(document, encode, next) {
      if (onReadDocument) {
        onReadDocument(document, {next});
      }
    }

    function callOnTestResultHandler(result) {
      if (onTestResult) {
        onTestResult(result);
      }
    }

    function callOnFinishHandler(result) {
      if (onFinish) {
        onFinish(result);
      }
    }

    const basePath = resolve(rootDir);
    const filter = getIgnoreFilters({rootDir, extensions, ignoreFile});

    /* eslint dot-location:0*/
    return readdir.stream(rootDir, {basePath, filter, deep: true})
      .pipe(through2Concurrent.obj({maxConcurrency}, callOnFileHandler))
      .pipe(through2Concurrent.obj({maxConcurrency}, callOnReadDocument))
      .on('data', callOnTestResultHandler)
      .on('finish', callOnFinishHandler);
  }
};
