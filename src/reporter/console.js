/* eslint-disable class-methods-use-this */
import 'babel-polyfill';

export default class ConsoleReporter {
  onTestResult(result) {
    this.printMessage(`Got response ${result.statusCode} from ${result.url}`);
  }

  printMessage(message) {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}
