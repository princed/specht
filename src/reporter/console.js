import 'babel-polyfill';

export default class ConsoleReporter {
  onTestResult(result) {
    this.printMessage(`Got response ${result.statusCode} from ${result.url}`);
  }

  printMessage(message) {
    console.log(message);
  }
}
