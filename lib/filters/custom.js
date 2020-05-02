const defaultFilters = require('nunjucks/src/filters');
const n2f = require('num2fraction');

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
  fraction: function(str, separator, largerThanOneSeparator) {
    separator = separator || '-';
    largerThanOneSeparator = largerThanOneSeparator || ' ';
    let number = Number.parseFloat(str);
    if (isNaN(number)) return '';
    let rounded = Math.floor(number);
    if (number < 1) return n2f(str).replace('/', separator);
    else return rounded + (number !== rounded ? largerThanOneSeparator + n2f(number - rounded).replace('/', separator) : '');
  },
  match: function(str, regexp, flags) {
    if (regexp instanceof RegExp === false) {
      regexp = new RegExp(regexp, flags);
    }
    return str.match(regexp);
  }
};