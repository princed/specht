import {SAXParser} from 'parse5';
import {createReadStream} from 'fs';

export default function parseHTML({fullPath, rules, push, next}) {
  const htmlParser = new SAXParser();

  htmlParser.on('startTag', (name, attrs) => {
    const attribute = rules.get(name);

    if (attribute) {
      attrs.forEach((attr) => {
        if (attr.name === attribute) {
          push(attr.value);
        }
      });
    }
  });

  htmlParser.on('end', next);

  createReadStream(fullPath, {encoding: 'utf-8'}).pipe(htmlParser);
}
