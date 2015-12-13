
// Exercise the SugarLisp Reader With Plus Dialect
// note: this should be changed to be a proper test with pass/fail asserts

var reader = require('sugarlisp-core/reader');
var sl = require('sugarlisp-core/sl-types');

function testReader(msg, src) {
  console.log('* ' + msg + ' ' + src);
  // the .slisp filename pulls in the sugarlisp plus dialect
  var formtree = reader.read_from_source(src, 'testReader.slisp');
  //console.log('lists:', JSON.stringify(formtree.toJSON()));
  console.log('\n' + sl.pprintSEXP(formtree.toJSON(),{omitTop: true, bareSymbols: true}) + '\n');
}

// repeat of sugarlisp "core" syntax tests
// (confirm "plus" doesn't affect "core")

testReader('a symbol:', 'sym');
testReader('a string:', '"str"');
testReader('a number:', '13');
testReader('a number:', '173.97');
testReader('a negative number:', '-13');
testReader('a negative number:', '-173.97');
testReader('nil:', 'nil');
testReader('null:', 'null');
testReader('true:', 'true');
testReader('false:', 'false');
testReader('a list of all atom types:', '(list "string1" \'string2\' 123 123.23 nil null true false)');
testReader('function:', '(var f (function (x y) (+ x y)))');
testReader('function:', '(var f (function (x y) (- x y)))');
testReader('html symbol overlap test:', '(var f (function (x y z) (if (< x y) x (if (<= x z) z))))');
testReader('lisp comment by itself:', '(\n; a comment\n)');
testReader('lisp comment in code:', '(do "hello"\n; a comment\n(+ 2 3))\n; another comment');
testReader('some javascript:', '(javascript "alert(\'hello\');")');
testReader('js comment by itself:', '(\n// a comment\n)');
testReader('js comments:', '(do "hello"\n// a comment\n(+ 2 3))\n// another comment');
testReader('js block comment one line:', '(do "hello"\n/* a comment */\n(+ 2 3))\n/* another comment */');
testReader('js block comment multi line:', '/*\n* multi line\n* comment */\n(do "hello" /* a \ncomment\n*/\n(+ 2 3))');
testReader('arrow function (prefix):', '(=> (x y) (+ x y))');


// test sugarlisp plus additions

testReader('simple infix dot:', '(console.log "hello")');
testReader('simple prefix not:', '!true');
testReader('pre-increment:', '++x');
testReader('post-increment:', 'x++');
testReader('unquote:', '~x');
testReader('splicing unquote:', '~@x');
testReader('an array:', '(var arr [1 2 3])');
testReader('array access:', 'arr[x]');
testReader('js object literal:', '{ first: "fred", last: "flintstone", age: 54, cartoon: true, toString: (function () (this.first)) }');
testReader('json with quoted keys:', '{ "first": "fred", "last": "flintstone", "age": 54, "cartoon": true }');
testReader('code block:', '{ (console.log "hello") }');
testReader('@ for "this.":', '(@error "if? expects a condition...")');
testReader('arrow function (infix) 1:', '(x y) => (+ x y)');
testReader('arrow function (infix): 2', '(var add (x y) => (+ x y))');
testReader('#/ regex','(if? (.test #/[^\.]+\.[^\.]+/ "filename.ext") true)');

// template strings

testReader('simple template string:',
    '(console.log "hello ${name}")');

testReader('one template string within another:',
    '\n"outerbegin ${(map list (function (elem)\n' +
    '         "inner ${elem}"))} outerend"'); 

testReader('code template string with indent marks:',
    '\n(case ["if?" condition iftrue iffalse]\n' +
    '  """(${condition} ?\n' +
    '   ..    ${iftrue} :\n' +
    '   ..    ${iffalse})""")');

