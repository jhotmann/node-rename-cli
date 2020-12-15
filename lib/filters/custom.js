const defaultFilters = require('nunjucks/src/filters');
const Fraction = require('fraction.js');

module.exports = {
  big: defaultFilters.upper,
  little: defaultFilters.lower,
  pascal: function(str) {
    str = str || '';
    return str.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter) {
      return letter.toUpperCase();
    }).replace(/[\s\-_.]+/g, '');
  },
  camel: function(str) {
    str = str || '';
    return str.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/[\s\-_.]+/g, '');
  },
  kebab: function(str) {
    str = str || '';
    return str
      .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
      .map(x => x.toLowerCase())
      .join('-');
  },
  snake: function(str) {
    str = str || '';
    return str
      .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
      .map(x => x.toLowerCase())
      .join('_');
  },
  fraction: function(str, separator, largerThanOneSeparator) {
    let frac = new Fraction(str);
    if (isNaN(frac.n) || isNaN(frac.d)) return '';
    return frac.toFraction(true).replace(' ', largerThanOneSeparator || ' ').replace('/', separator || '-');
  },
  match: function(str, regexp, flags, group) {
    if (regexp instanceof RegExp === false) {
      regexp = new RegExp(regexp, flags);
    }
    if (Number.isInteger(flags) && group === undefined) group = flags;
    group = group || 0;
    let results = str.match(regexp);
    if (typeof group === 'string') {
      return results.groups[group];
    }
    return results[group];
  },
  regexReplace: function (str, regexp, flags, replacement) {
    if (!regexp) return str;
    flags = flags || '';
    if (replacement === undefined) {
      if (flags.match(/^[gimsuy]+$/)) {
        replacement = '';
      } else {
        replacement = flags;
        flags = undefined;
      }
    }
    let re = new RegExp(regexp, flags);
    return str.replace(re, replacement);
  },
  padNumber: function(str, length) {
    if (typeof length === "string") length = length.length;
    while (str.length < length) {
      str = '0' + str;
    }
    return str;
  }
};