import {SAXParser} from 'parse5';
import {createReadStream} from 'fs';

export default function parseHTML(path, rules, emitDocument, stopCallback) {
  const htmlParser = new SAXParser();

  htmlParser.on('startTag', (name, attrs) => {
    const attribute = rules.get(name);

    if (attribute) {
      attrs.forEach(attr => {
        if (attr.name === attribute) {
          emitDocument(attr.value);
        }
      });
    }
  });

  htmlParser.on('end', stopCallback);

  createReadStream(path, {encoding: 'utf-8'}).pipe(htmlParser);
}
