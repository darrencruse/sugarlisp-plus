// Exercise the SugarLisp Lexer
// note: this should be changed to be a proper test with pass/fail asserts

var lex = require('sugarlisp-core/lexer'),
    reader = require('sugarlisp-core/reader')
    sl = require('sugarlisp-core/sl-types');

function testLexer(msg, src) {
  console.log('* ' + msg + ' ' + src);
  var tokens = reader.nonlocal_tokens(src, 'testLexer.slisp');
  console.log(lex.formatTokenDump(tokens, lex.formatTokenSexp, "(tokens ", ")\n"));
}

// repeat of sugarlisp "core" lexer tests
// (confirm "plus" doesn't affect "core")

testLexer('a symbol:', 'sym');
testLexer('a string:', '"str"');
testLexer('a number:', '13');
testLexer('a number:', '173.97');
testLexer('a negative number:', '-13');
testLexer('a negative number:', '-173.97');
testLexer('nil:', 'nil');
testLexer('null:', 'null');
testLexer('true:', 'true');
testLexer('false:', 'false');
testLexer('a list of all atom types:', '(list "string1" \'string2\' 123 123.23 nil null true false)');
testLexer('function:', '(var f (function (x y) (+ x y)))');
testLexer('function:', '(var f (function (x y) (- x y)))');
testLexer('html symbol overlap test:', '(var f (function (x y z) (if (< x y) x (if (<= x z) z))))');
testLexer('lisp comment by itself:', '(\n; a comment\n)');
testLexer('lisp comment in code:', '(do "hello"\n; a comment\n(+ 2 3))\n; another comment');
testLexer('some javascript:', '(javascript "alert(\'hello\');")');
testLexer('js comment by itself:', '(\n// a comment\n)');
testLexer('js comments:', '(do "hello"\n// a comment\n(+ 2 3))\n// another comment');
testLexer('js block comment one line:', '(do "hello"\n/* a comment */\n(+ 2 3))\n/* another comment */');
testLexer('js block comment multi line:', '/*\n* multi line\n* comment */\n(do "hello" /* a \ncomment\n*/\n(+ 2 3))');
testLexer('arrow function (prefix):', '(=> (x y) (+ x y))');

// test sugarlisp plus additions

testLexer('simple infix dot:', '(console.log "hello")');
testLexer('simple prefix not:', '!true');
testLexer('pre-increment:', '++x');
testLexer('post-increment:', 'x++');
testLexer('unquote:', '~x');
testLexer('splicing unquote:', '~@x');
testLexer('an array:', '(var arr [1 2 3])');
testLexer('array access:', 'arr[x]');
testLexer('js object literal:', '{ first: "fred", last: "flintstone", age: 54, cartoon: true, toString: (function () (this.first)) }');
testLexer('json with quoted keys:', '{ "first": "fred", "last": "flintstone", "age": 54, "cartoon": true }');
testLexer('code block:', '{ (console.log "hello") }');
testLexer('@ for "this.":', '(@error "if? expects a condition...")');
testLexer('arrow function (infix) 1:', '(x y) => (+ x y)');
testLexer('arrow function (infix): 2', '(var add (x y) => (+ x y))');
testLexer('#/ regex','(if? (.test #/[^\.]+\.[^\.]+/ "filename.ext") true)');

// template strings

testLexer('simple template string:',
    '(console.log "hello ${name}")');

testLexer('one template string within another:',
    '\n"outerbegin ${(map list (function (elem)\n' +
    '         "inner ${elem}"))} outerend"');

testLexer('code template string with indent marks:',
    '\n(case ["if?" condition iftrue iffalse]\n' +
    '  """(${condition} ?\n' +
    '   ..    ${iftrue} :\n' +
    '   ..    ${iffalse})""")');
