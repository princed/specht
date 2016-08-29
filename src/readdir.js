import through2 from 'through2';
import readdirp from 'readdirp';
import ignore from 'ignore-file';
import {resolve, extname} from 'path';

function File({name, path, fullPath}, encode) {
  return {
    name,
    path,
    fullPath,
    encode
  };
}


function getIgnoreFilters({rootDir, extensions = [], ignoreFile = ''}) {
  let filterByExtension = () => true;

  if (extensions.length) {
    filterByExtension = entry => extensions.includes(extname(entry.name));
  }

  if (!ignoreFile) {
    return {
      fileFilter: filterByExtension
    };
  }

  const filter = ignore.sync(resolve(rootDir, ignoreFile));
  const fileFilter = entry => filterByExtension(entry) && !filter(entry.path);
  const directoryFilter = entry => !filter(entry.path);

  return {
    fileFilter,
    directoryFilter
  };
}

export default {
  read: (workingDirectory, {extensions, ignoreFile, onReadFile, onReadDocument, onTestResult, onFinish}) => {
    function callOnFileHandler(fileInfo, encode, next) {
      const file = new File(fileInfo, encode);

      if (onReadFile) {
        onReadFile(file, {
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

    const ignoreFilters = getIgnoreFilters({
      rootDir: workingDirectory,
      extensions,
      ignoreFile
    });

    /* eslint dot-location:0*/
    return readdirp({
      root: workingDirectory,
      fileFilter: ignoreFilters.fileFilter,
      directoryFilter: ignoreFilters.directoryFilter
    }).pipe(through2.obj({
      objectMode: true
    }, callOnFileHandler)).pipe(through2.obj(callOnReadDocument))
      .on('data', callOnTestResultHandler)
      .on('finish', callOnFinishHandler);
  }
};
