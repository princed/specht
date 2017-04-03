/* eslint-disable class-methods-use-this */
import 'babel-polyfill';
import {testStarted, testFinished, testFailed} from 'teamcity-service-messages';

export default class TeamcityReporter {
  onTestResult(result) {
    const SUCCESS_CODE = 200;
    testStarted({name: result.document});

    if (result.statusCode !== SUCCESS_CODE) {
      const message = `Got response ${result.statusCode} from ${result.url}. At first found in path: ${result.sourceFilePath}.`;
      testFailed({name: result.document, message});
    }
    testFinished({name: result.document});
  }
}
