var sl = require('sugarlisp-core/sl-types'),
    reader = require('sugarlisp-core/reader'),
    utils = require('sugarlisp-core/utils'),
    ctx = require('sugarlisp-core/transpiler-context'),
    rfuncs = require('./readfuncs');

// the infix dot operator for property lookup
// note that we encourage use of infix dot since it's so familiar
// to javascript programmers i.e. (console.log "hello"), but for
// backward compatibility with lispyscript 1 (and other lisps
// which have similar constructs), this also accepts property prefix
// forms like e.g. (.log console "hello").  Since we normally consider
// . an infix operator though - to get the "property prefix" version
// you *must* omit the space between the "." and the property.  Which
// is to say "(.log console)" represents "console.log", but
// "(. log console)" (note the space after the dot) represents
// "log.console".
//
// lastly notice we leave infix "." as "." but we change dot property
// access to a different prefix "dotprop".  So console.log becomes
// (. console log) but .log console becomes (dotprop log console)

exports['.'] = reader.operator({
  prefix: reader.operator('prefix', 'unary', dotpropexpr, 5),
  infix: reader.operator('infix', 'binary', infixdot2prefix, 19)
});

function dotpropexpr(lexer, opSpec, dotOpForm) {
  var propertyNameToken = lexer.next_token();
  var objectForm = reader.read(lexer, opSpec.precedence);
  return sl.list('dotprop', propertyNameToken, objectForm);
}

function infixdot2prefix(lexer, opSpec, leftForm, opForm) {
  // To handle right-associative operators like "^", we allow a slightly
  // lower precedence when parsing the right-hand side. This will let an
  // operator with the same precedence appear on the right, which will then
  // take *this* operator's result as its left-hand argument.
  var rightForm = reader.read(lexer,
      opSpec.precedence - (opSpec.assoc === "right" ? 1 : 0));

  return sl.list(opForm, leftForm, rightForm);
}

// square bracketed arrays of data
exports['['] = function(lexer) {
  return rfuncs.read_array(lexer);
};
// end brackets are read as token via the function above
// (so they're not expected to be read via the syntax table)
exports[']'] = reader.unexpected;

// traditional array/object access with name then bracket i.e. arr[(index or prop)]
// note:  they *must* omit spaces between variable name and the opening bracket
exports['*:bracket-index'] = function(lexer) {
  var form;
  // note: can't use peek_token below
  //   (since that uses the syntax table that's an infinite loop!)
  var token = lexer.next_delimited_token(undefined, "[");
  if(token) {
    form = sl.list(sl.atom('get', {token: token}),
                      reader.read(lexer),
                      sl.atom(token.text));
    lexer.skip_token("]");
  }
  return form;
};

// javascript object literals
exports['{'] = function(lexer) {
  return rfuncs.read_objectliteral_or_codeblock(lexer);
};
exports['}'] = reader.unexpected;

// templated strings with ${} escapes
// unlike es6 we let them work within all of ', ", or `
// if no ${} are used it winds up a simple string
// but when ${} are used the result is a (str...)
exports['\''] = function(lexer) {
  return rfuncs.read_template_string(lexer, "'", "'", ['str']);
};

exports['\"'] = function(lexer) {
  return rfuncs.read_template_string(lexer, '"', '"', ['str']);
};

// es6 template string literal
exports['`'] = function(lexer) {
  // a template string surrounded in backticks becomes (str...)
  return rfuncs.read_template_string(lexer, "`", "`", ['str']);
};

// arrow functions
// note precedence level less than "=" so e.g. "fn = (x) => x * x" works right
// also note this was originally just exports['=>'] = reader.infix(12.5);
// but the below was done to simplify the generated code and avoid one IIFE
// OLD exports['=>'] = reader.operator(arrowFnTransform, 7.5, 'infix', 'binary');
exports['=>'] = reader.operator('infix', 'binary', arrow2prefix, 7.5);

function arrow2prefix(lexer, opSpec, argsForm, arrowOpForm) {

  var fBody = reader.read(lexer, opSpec.precedence);
  if(sl.isList(fBody) && sl.valueOf(fBody[0]) === 'do') {
    fBody[0].value = "begin";
  }

  return sl.list(arrowOpForm, argsForm, fBody);
}

// regexes in the form #/../
// this is a shorthand for (regex "(regex string)")
// note this is close to javascript's "/" regexes except for starting "#/"
// the initial "#" was added to avoid conflicts with "/"
// (the "#" is optional in *sugarscript* btw)
exports['#/'] = function(lexer, text) {
  // desugar to core (regex ..)
  return sl.list("regex",
                sl.addQuotes(sl.valueOf(reader.read_delimited_text(lexer, "#/", "/",
                  {includeDelimiters: false}))));
}

// Gave unquotes an extra ~ for now while I get them working
// (so they wouldn't break the macros)
exports['~~'] = function(lexer) {
  lexer.skip_text('~~');
  return sl.list('unquote', reader.read(lexer));
};

// coffeescript style @ (alternative to "this.")
exports['@'] = function(lexer) {
  var atToken = lexer.next_token('@');
  var nextForm = reader.read(lexer);
  if(!(sl.typeOf(nextForm) === 'symbol' ||
       (sl.isList(nextForm) &&
        nextForm.length > 0 &&
        sl.typeOf(nextForm[0]) === 'symbol')))
  {
    lexer.error("@ must precede the name of some object member");
  }
  // we return (. this <property>)
  return sl.list(sl.atom('.', atToken), sl.atom('this', atToken), nextForm);
}

// lispy quasiquoted list
// THIS STILL HAS WORK TO DO - IT'S REALLY JUST AN ALIAS FOR [] RIGHT NOW
//
// these use ` like a traditional lisp except they are bookended
// on both ends i.e. `(...)`.  It felt odd to do otherwise because
// all our other (string) quoting follows javascript conventions
// so has them on both ends.
//
// note we *only* support the quasiquoting of lists.
//
// since we also support es6 template string literals which use
// `` to quote them, the paren in `( distinguish a quasiquoted
// list *form* from a standard es6 template *string*.
//
// If people need to quote a *string* that starts with ( they
// should just use '(...)' or "(...)" instead.
//
exports['`('] = function(lexer) {
  return reader.read_delimited_list(lexer, '`(', ')`', ["quasiquote"]);
};
exports[')`'] = reader.unexpected

// this may be temporary it's just an alias for arrays []
// (it should be just a normal quoted list - working on that)
exports['``('] = function(lexer) {
  return reader.read_delimited_list(lexer, '``(', ')``', ["array"]);
};
exports[')``'] = reader.unexpected

// a js code template (javascript string with substitutions) is
// surrounded in triple double-quotes
exports['"""'] = function(lexer) {
  var forms = rfuncs.read_template_string(lexer, '"""', '"""', ['code']);
  // read_template_string converts to a normal string if there's only one:
  if(!sl.isList(forms)) {
    forms = sl.list('code', forms);
  }
  return forms;
};

// a lispy code template (lispy code with substitutions) is
// surrounded in triple single-quotes
exports["'''"] = function(lexer) {
  return reader.read_delimited_list(lexer, "'''", "'''", ["codequasiquote"]);
};

// Gave unquotes an extra ~ for now while I get them working
// (so they wouldn't break the macros)
exports['~~'] = function(lexer) {
  lexer.skip_text('~~');
  return sl.list('unquote', reader.read(lexer));
};

exports['~~@'] = function(lexer) {
  lexer.skip_text('~~@');
  return sl.list('splice-unquote', reader.read(lexer));
};

// note below are higher precedence than '.'
exports['~'] = reader.prefix(19.5);
exports['~@'] = reader.prefix(19.5);

// although basic "word-style" (whitespace) delimiting
// works well in lispy core, declaring symbols explicitly
// avoids problems arising with the syntax sugar of lispy+
exports['!'] = reader.prefix(18, {assoc: "right"});

// ++i and i++
exports['++'] = reader.operator({
  prefix: reader.prefix(17, {assoc:"right", nospace: true}),
  postfix: reader.postfix(18, {altprefix: "post++", nospace: true})
});

// --i and i--
exports['--'] = reader.operator({
  prefix: reader.prefix(17, {assoc:"right", nospace: true}),
  postfix: reader.postfix(18, {altprefix: "post--", nospace: true})
});

// variable_ is a paren free var -
//  this is really just a helper function,
//  it's used by #cell below as well as
//  by "var" in scripty
// NO LONGER USING THIS IN SCRIPTY NOW THAT I SUPPORT multiple
// COMMA SEPARATED VARS - NEED TO SEE IF IT MAKES SENSE TO MERGE
// THEM TOGETHER NOT SURE YET

exports['variable_'] = function(lexer, text) {
  var varToken = lexer.next_token(text);
  var varNameToken = lexer.next_token();
  var varNameSym = sl.atom(varNameToken);

// SEEING IF I CAN SIMPLIFY THIS BACK TO ALLOWING SIMPLE ARRAYS
// MY THOUGHT WAS SIMPLY THAT IMMEDIATELY UPON THE
// READER RECEIVING THE RETURN VALUE FROM CALLING THESE
// SYNTAX FUNCTIONS IT CHECKS IF IT'S GOT AN ARRAY RATHER
// THAN A lists.List TYPE, AND IF SO IT CALLS lists.fromArray()
// TO PROMOTE THE ARRAY TO A LIST.  AS PART OF THAT IT
// IS ALSO GOING TO HAVE TO PROMOTE ALL THE PRIMITIVES TO
// BEING WRAPPED - *IF* I NEED TO ALSO IMMEDIATELY SET
// PARENTS TOO.  BUT IS THAT NEEDED?  COULD I GET BY
// WITH SAYING PARENTS ARE ONLY AVAILABLE IN THE keyword
// FUNCTIONS NOT THE READER FUNCTIONS?  BUT I DO USE PARENTS
// TO FIND SURROUNDING LOCAL DIALECTS RIGHT?  IF THERE any
// WAY THIS COULD HAVE WORKED DIFFERENTLY?  WHAT IF I'D done
// THE "ENVIRONMENT" IDEA LIKE AN INTERPRETER WOULD?  COULD
// THE "DIALECTS" HAVE BEEN TREATED LIKE A VAR IN THE "ENVIRONMENT"
// *INSTEAD* OF ON THE "FORMS"??
  var list = sl.list(sl.atom("var", {token: varToken}), sl.atom(varNameToken));
  // if(lexer.on('=')) {
  //   // it's got an initializer
  //   lexer.skip_text('=');
  //   list.push(reader.read(lexer));
  // }
  // else {
  //   list.push("undefined");
  // }

  return list;
};

// cells can cause reactions when their values change
// a cell can be declared via:
//
//    #cell name
// or
//    #cell name = val
//
// (note right now you can only declare one variable per #cell statement)
exports['#cell'] = function(lexer, text) {
  // #cell is like "var" except it records the var as observable
  // so start by making a normal "var" form list i.e. (var varname...)
  var varForm = exports["variable_"](lexer, text);

  // since sugarlisp doesn't pay attention to the scope of
  // the var statements it transpiles, #cell variable names are
  // considered global to the source file - this list is what's
  // checked by #react to confirm the variable is a cell:
  var varname = sl.valueOf(varForm[1]);
  if(lexer.cells.indexOf(varname) === -1) {
    lexer.cells.push(varname);
  }

  // return the var form so a "var" statement winds up in the output code
  return varForm;
};

// binding assignment works with bindable vars
// invoke the reactor function "after" with #=
// (this is the version I assume would most often be used)
// OLD DELETE exports['#='] = reader.infix(7, {altprefix: "#afterset"});
exports['#='] = reader.infix(7);
// invoke the reactor function "before" with ##=
// OLD DELETE exports['##='] = reader.infix(7, {altprefix: "#beforeset"});
exports['##='] = reader.infix(7);
