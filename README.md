# sugarlisp-plus
SugarLisp Plus is a lisp/javascript hybrid.

#### WORK IN PROGRESS - NOT TO BE USED IN PRODUCTION

Whereas SugarLisp Core is a simple lisp with everything a (prefix) s-expression,
SugarLisp Plus extends Core with syntax borrowed from javascript, including:

* simpler property access e.g. (console.log employee[id])
* omit parens for simple operations like !x, ++x, x++
* first-class JSON support, including:
  * [] arrays [x, y, z]
  * {} objects { key: value }
* multi statement/expression code blocks delimited with {...}
* template strings e.g. "${name} you averaged ${(/ total rounds)}."
* infix arrow functions e.g. (var square (x) => (* x x))

And from some other languages:

* regexes as #/<regex>/ (similar to Clojure)
* "@" as an alternate for "this." (similar to CoffeeScript)
