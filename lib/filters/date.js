/**
 * Modified nunjucks-date-filter
 * https://github.com/piwi/nunjucks-date-filter
 *
 * Copyright (c) 2015 Pierre Cassat
 * Licensed under the Apache 2.0 license.
 */

'use strict';

let moment      = require('moment');
let nunjucks    = require('nunjucks');
let nlib        = require('nunjucks/src/lib');

// default default format (ISO 8601)
let dateFilterDefaultFormat = 'YYYYMMDD';

// a date filter for Nunjucks
// usage: {{ my_date | date(format) }}
// see: <http://momentjs.com/docs/>
function dateFilter(date, format)
{
    let result = '';
    let errs = [];
    let args = [];
    let obj;
    Array.prototype.push.apply(args, arguments);
    try {
        obj = moment(date);
    } catch (err) {
        errs.push(err);
    }
    if (obj) {
        try {
            if (obj[format] && nlib.isFunction(obj[format])) {
                result = obj[format].apply(obj, args.slice(2));
            } else {
                if (dateFilterDefaultFormat !== null) {
                    result = obj.format(format || dateFilterDefaultFormat);
                } else {
                    result = obj.format(format);
                }
            }
        } catch(err) {
            //errs.push(err);
        }
    }

    if (errs.length) {
        return errs.join("\n");
    }
    return result;
}
module.exports = dateFilter;

// set default format for date
module.exports.setDefaultFormat = function(format) {
    dateFilterDefaultFormat = format;
};

// install the filter to nunjucks environment
module.exports.install = function(env, customName) {
    (env || nunjucks.configure()).addFilter(customName || 'date', dateFilter);
};
