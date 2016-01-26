import {SAXParser} from 'parse5';
import {createReadStream} from 'fs';

export default function parseHTML(path, emitDocument, stopCallback) {
  const htmlParser = new SAXParser();

  htmlParser.on('startTag', (name, attrs) => {
    if (name === 'hub-page-help-link') {
      attrs.forEach(attr => {
        if (attr.name === 'url') {
          emitDocument(attr.value);
        }
      });
    }
  });

  htmlParser.on('end', stopCallback);

  createReadStream(path, {encoding: 'utf-8'}).pipe(htmlParser);
}
