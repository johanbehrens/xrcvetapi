'use strict';
var moment = require('moment');

module.exports = {
  addDays,
  addHours,
};

function addDays(days, format) {
  let t = moment().add(days, 'days').startOf('day');
  if (format) {
    t = t.format(format);
  }
  return t;
}

function addHours(hours) {
  return moment().add(hours, 'hours').toISOString();
}
