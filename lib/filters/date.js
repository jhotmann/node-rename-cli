/**
 * Modified nunjucks-date-filter
 * https://github.com/piwi/nunjucks-date-filter
 *
 * Copyright (c) 2015 Pierre Cassat
 * Licensed under the Apache 2.0 license.
 */

'use strict';

const format = require('date-fns/format');
const nunjucks = require('nunjucks');

// default default format (ISO 8601)
let dateFilterDefaultFormat = 'yyyyMMdd';

// a date filter for Nunjucks
// usage: {{ my_date | date(format) }}
function dateFilter(date, dateFormat) {
    try {
        return format(date, dateFormat || dateFilterDefaultFormat);
    } catch (e) {
        return '';
    }
}
module.exports = dateFilter;

// set default format for date
module.exports.setDefaultFormat = function(dateFormat) {
    dateFilterDefaultFormat = dateFormat;
};

// install the filter to nunjucks environment
module.exports.install = function(env, customName) {
    (env || nunjucks.configure()).addFilter(customName || 'date', dateFilter);
};
