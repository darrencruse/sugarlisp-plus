
module.exports = [

  // traditional array/object access with name then bracket i.e. arr[(index or prop)]
  // note:  they *must* omit spaces between variable name and the opening bracket
  {
    category: 'bracket-index',
    match: /[a-zA-Z_$][0-9a-zA-Z_$\.]*\[/g
  },

  // "special" symbols that don't require whitespace or punctuation to end them.
  {
    category: 'symbol',
    match: /("""|\.\.\.|\.\.|\b!\b|=>|~@|~|@|\$\{|--|\+\+|\+\=|#\/|\/)/g
  },

  // "punctuation" is special in that it terminates typical symbol tokens
  // (i.e. those read with "get_word_token")
  // note this adds to the punctuation already defined in core
  {
    category: 'punctuation',
    match: /(\[|\]|\{|\}|\.|\:|\+)/g
  }

];
