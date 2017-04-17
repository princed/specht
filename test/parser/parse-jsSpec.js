import test from 'ava';
import {parseCode} from '../../src/parser/parse-js';
import convertRules from '../../src/convert-rules';


test('should add matched rule to the result', (t) => {
  const result = [];
  const rules = convertRules(['foo:0']);


  parseCode('foo("1")', rules, (value) => {
    result.push(value);
  });


  t.is(result.length, 1);
});


test('should pass context to the push/result function', (t) => {
  const result = [];
  const rules = convertRules(['foo:1']);


  parseCode('foo("pre","1", "post")', rules, (value, context) => {
    t.deepEqual(context.args(), ['pre', '1', 'post']);
    result.push(value);
  });


  t.is(result.length, 1);
});


test('should return empty result if we don`t found any matches', (t) => {
  const result = [];
  const rules = convertRules(['foo:0']);


  parseCode('var bar = function(a){}; bar("1"); zoo("1")', rules, value => result.push(value));


  t.is(result.length, 0);
});


test('should parse multiple expressions', (t) => {
  const result = [];
  const rules = convertRules(['foo:0', 'bar:0']);


  parseCode('foo("1"); bar("2")', rules, (value) => {
    result.push(value);
  });


  t.is(result.length, 2);
});


test('should parse identifiers', (t) => {
  const result = [];
  const rules = convertRules(['foo:0']);


  parseCode('var a = "1"; foo(a);', rules, (value) => {
    result.push(value);
  });


  t.is(result.length, 1);
});


test('should return error if argument is not a string', (t) => {
  const rules = convertRules(['foo:0']);

  const errors = parseCode('foo(100);', rules, () => {
  });


  t.is(errors.length, 1);
});


test('should return error if identifier is not a string', (t) => {
  const rules = convertRules(['foo:0']);

  const errors = parseCode('var a = 1; foo(a);', rules, () => {
  });


  t.is(errors.length, 1);
});


test('should not report error rule argument is not a number', (t) => {
  const result = [];
  const rules = convertRules(['foo:Not_a_Number']);

  const errors = parseCode('foo("1");', rules, value => result.push(value));


  t.is(result.length, 0);
  t.is(errors.length, 0);
});


test('should parse only functions', (t) => {
  const result = [];
  const rules = convertRules(['foo:0']);


  parseCode('var foo = "1";', rules, value => result.push(value));


  t.is(result.length, 0);
});


test('should parse identifiers are referenced on a function', (t) => {
  const result = [];
  const rules = convertRules(['foo:0']);


  parseCode('var foo = function(a){}; foo("1");', rules, value => result.push(value));


  t.is(result.length, 1);
});
