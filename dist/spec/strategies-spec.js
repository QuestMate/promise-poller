"use strict";

var _strategies = _interopRequireDefault(require("../lib/strategies"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('promise-poller strategies', function () {
  describe('fixed interval strategy', function () {
    it('polls on a fixed interval', function () {
      var options = {
        interval: 1000
      };
      var expectedIntervals = [1000, 1000, 1000, 1000, 1000];
      expectedIntervals.forEach(function (interval, index) {
        expect(_strategies.default['fixed-interval'].getNextInterval(index, options)).toEqual(interval);
      });
    });
  });
  describe('linear backoff strategy', function () {
    it('increases the interval linearly', function () {
      var options = {
        start: 1000,
        increment: 500
      };
      var expectedIntervals = [1000, 1500, 2000, 2500, 3000];
      expectedIntervals.forEach(function (interval, index) {
        expect(_strategies.default['linear-backoff'].getNextInterval(index, options)).toEqual(interval);
      });
    });
  });
  describe('exponential backoff strategy', function () {
    it('uses exponential backoff with jitter', function () {
      var randoms = [0.2, 0.4, 0.6, 0.8, 0.9];
      var expectedIntervals = [1000, 1400, 2800, 6600, 10000];

      Math.random = function () {
        return randoms.shift();
      };

      var options = {
        min: 1000,
        max: 10000
      };
      expectedIntervals.forEach(function (interval, index) {
        expect(_strategies.default['exponential-backoff'].getNextInterval(index, options)).toEqual(interval);
      });
    });
  });
});