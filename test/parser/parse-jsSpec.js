import test from 'ava';
import {parseCode} from '../../src/parser/parse-js';
import convertRuels from '../../src/convert-rules';


test('should parse javascript code', (t) => {
  const result = [];
  const rules = convertRuels(['foo:0']);


  parseCode('foo("1")', rules, (value) => {
    result.push(value);
  });


  t.is(result.length, 1);
});


test('should parse multiple expressions', (t) => {
  const result = [];
  const rules = convertRuels(['foo:0', 'bar:0']);


  parseCode('foo("1"); bar("2")', rules, (value) => {
    result.push(value);
  });


  t.is(result.length, 2);
});


test('should parse identifiers', (t) => {
  const result = [];
  const rules = convertRuels(['foo:0']);


  parseCode('var a = "1"; foo(a);', rules, (value) => {
    result.push(value);
  });


  t.is(result.length, 1);
});


test('should return error if argument is not a string', (t) => {
  const rules = convertRuels(['foo:0']);

  const errors = parseCode('foo(100);', rules, () => {
  });


  t.is(errors.length, 1);
});


test('should return error if identifier is not a string', (t) => {
  const rules = convertRuels(['foo:0']);

  const errors = parseCode('var a = 1; foo(a);', rules, () => {
  });


  t.is(errors.length, 1);
});
