"use strict";

var _promisePoller = _interopRequireWildcard(require("../lib/promise-poller"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

describe('Promise Poller', function () {
  it('returns a promise', function () {
    var poller = (0, _promisePoller.default)({
      taskFn: function taskFn() {
        return Promise.resolve('yay');
      }
    });
    expect(poller.then).toBeDefined();
    expect(_typeof(poller.then)).toBe('function');
  });
  it('resolves the master promise when the poll succeeds', function (done) {
    (0, _promisePoller.default)({
      taskFn: function taskFn() {
        return Promise.resolve('yay');
      },
      interval: 500,
      retries: 3
    }).then(function (result) {
      expect(result).toBe('yay');
      done();
    }, function () {
      return fail('Master promise was rejected');
    });
  });
  it('rejects the master promise when the poll fails', function (done) {
    (0, _promisePoller.default)({
      taskFn: function taskFn() {
        return Promise.reject('derp');
      },
      interval: 500,
      retries: 3
    }).then(function () {
      return fail('Promise was resolved');
    }, done);
  });
  it('rejects the master promise with an array of rejections', function (done) {
    var counter = 0;
    (0, _promisePoller.default)({
      taskFn: function taskFn() {
        return Promise.reject(++counter);
      },
      interval: 500,
      retries: 3
    }).then(function () {
      return fail('Promise was resolved');
    }, function (errs) {
      expect(errs).toEqual([1, 2, 3]);
      done();
    });
  });
  it('fails the poll if the timeout is exceeded', function (done) {
    var taskFn = function taskFn() {
      return new Promise(function (resolve) {
        setTimeout(function () {
          return resolve('derp');
        }, 5000);
      });
    };

    (0, _promisePoller.default)({
      taskFn: taskFn,
      timeout: 1000,
      interval: 500,
      retries: 3
    }).then(function () {
      fail('Promise was resolved, should have timed out');
      done();
    }, function (error) {
      expect(error[2].message.indexOf('timed out')).not.toBeLessThan(0);
      done();
    });
  });
  it('rejects the master promise if the master timeout is exceeded', function (done) {
    var numPolls = 0;

    var taskFn = function taskFn() {
      return new Promise(function (resolve, reject) {
        numPolls += 1;
        setTimeout(function () {
          return reject('derp');
        }, 250);
      });
    };

    (0, _promisePoller.default)({
      taskFn: taskFn,
      masterTimeout: 500,
      retries: 10
    }).then(function () {
      fail('Master promise was resolved, should have hit master timeout');
      done();
    }, function () {
      expect(numPolls).not.toBeGreaterThan(2);
      done();
    });
  });
  it('waits the given interval between attempts', function (done) {
    var last = 0;
    var now;

    var taskFn = function taskFn() {
      now = Date.now();

      if (last) {
        expect(now - last).not.toBeLessThan(500);
      }

      last = now;
      return Promise.reject('derp');
    };

    (0, _promisePoller.default)({
      taskFn: taskFn,
      interval: 500,
      retries: 3
    }).then(null, done);
  });
  it('uses the default retries of 5 if not specified', function (done) {
    var counter = 0;

    var taskFn = function taskFn() {
      counter++;
      return Promise.reject('derp');
    };

    (0, _promisePoller.default)({
      taskFn: taskFn,
      interval: 500
    }).then(null, function () {
      expect(counter).toBe(5);
      done();
    });
  });
  it('tries <retries> times before giving up', function (done) {
    var counter = 0;

    var taskFn = function taskFn() {
      counter++;
      return Promise.reject('derp');
    };

    (0, _promisePoller.default)({
      taskFn: taskFn,
      interval: 500,
      retries: 3
    }).then(null, function () {
      expect(counter).toBe(3);
      done();
    });
  });
  it('uses the default interval of 500 if not specified', function (done) {
    var last = 0;
    var now;

    var taskFn = function taskFn() {
      now = Date.now();

      if (last) {
        expect(now - last).not.toBeLessThan(500);
      }

      last = now;
      return Promise.reject('derp');
    };

    (0, _promisePoller.default)({
      taskFn: taskFn,
      retries: 3
    }).then(null, done);
  });
  it('throws an exception if no taskFn was specified', function () {
    var fn = function fn() {
      return (0, _promisePoller.default)();
    };

    expect(fn).toThrowError(/No taskFn/);
  });
  it('calls the progress callback with each failure', function (done) {
    var count = 0;

    var callback = function callback(retriesRemaining, error) {
      expect(error).toEqual('derp');
      expect(retriesRemaining).toEqual(3 - count);
      count++;
    };

    (0, _promisePoller.default)({
      taskFn: function taskFn() {
        return Promise.reject('derp');
      },
      interval: 500,
      retries: 3,
      progressCallback: callback
    }).then(null, function () {
      expect(count).toEqual(3);
      done();
    });
  });
  it('wraps a non-promise task function return in Promise.resolve', function (done) {
    (0, _promisePoller.default)({
      taskFn: function taskFn() {
        return 'foobar';
      },
      interval: 500,
      retries: 3
    }).then(function (val) {
      expect(val).toEqual('foobar');
      done();
    });
  });
  it('fails the poll if an exception is thrown in the task function', function (done) {
    (0, _promisePoller.default)({
      taskFn: function taskFn() {
        throw new Error('oops');
      },
      interval: 500,
      retries: 3
    }).then(null, function (err) {
      expect(err.message).toBe('oops');
      done();
    });
  });
  it('rejects the master promise if false is returned from the task function', function (done) {
    var counter = 0;

    var taskFn = function taskFn() {
      if (++counter === 1) {
        return false;
      } else {
        return Promise.reject('derp');
      }
    };

    (0, _promisePoller.default)({
      taskFn: taskFn,
      interval: 500,
      retries: 3
    }).then(fail, function (err) {
      expect(err).toEqual(['Cancelled']);
      expect(counter).toEqual(1);
      done();
    });
  });
  it('rejects the master promise if the task promise rejects with the cancel token', function (done) {
    var counter = 0;

    var taskFn = function taskFn() {
      if (++counter === 1) {
        return Promise.reject(_promisePoller.CANCEL_TOKEN);
      } else {
        return Promise.reject('derp');
      }
    };

    (0, _promisePoller.default)({
      taskFn: taskFn,
      interval: 500,
      retries: 3
    }).then(fail, function (err) {
      expect(err).toEqual([_promisePoller.CANCEL_TOKEN]);
      expect(counter).toEqual(1);
      done();
    });
  });
  it('clears the master timeout if the master promise resolves', function (done) {
    var globalObj = jasmine.getGlobal();
    spyOn(globalObj, 'setTimeout').and.callFake(function () {
      return 42;
    });
    spyOn(globalObj, 'clearTimeout');
    (0, _promisePoller.default)({
      taskFn: function taskFn() {
        return Promise.resolve('foobar');
      },
      masterTimeout: 10000
    }).then(function (val) {
      expect(val).toEqual('foobar');
      expect(globalObj.setTimeout).toHaveBeenCalled();
      expect(globalObj.clearTimeout).toHaveBeenCalledWith(42);
      done();
    });
  });
  it('bails out when shouldContinue returns false', function (done) {
    var counter = 0;

    var taskFn = function taskFn() {
      return Promise.reject(++counter);
    };

    (0, _promisePoller.default)({
      taskFn: taskFn,
      shouldContinue: function shouldContinue(err) {
        if (err === 1) {
          return false;
        }
      }
    }).then(fail, function (err) {
      expect(err).toEqual([1]);
      done();
    });
  });
  it('continues to poll on success if shouldContinue returns true', function (done) {
    var counter = 0;

    var taskFn = function taskFn() {
      return Promise.resolve(++counter);
    };

    (0, _promisePoller.default)({
      taskFn: taskFn,
      shouldContinue: function shouldContinue(err, result) {
        return result < 3;
      }
    }).then(function (result) {
      expect(result).toEqual(3);
      done();
    });
  });
  describe('when task succeeds', function () {
    it('waits the given interval between attempts', function (done) {
      var last = 0;
      var now;

      var taskFn = function taskFn() {
        now = Date.now();

        if (last) {
          expect(now - last).not.toBeLessThan(500);
        }

        last = now;
        return Promise.resolve('w00t');
      };

      (0, _promisePoller.default)({
        taskFn: taskFn,
        interval: 500,
        retries: 3,
        shouldContinue: function shouldContinue() {
          return true;
        }
      }).then(null, done);
    });
    it('rejects the master promise if the master timeout is exceeded', function (done) {
      var numPolls = 0;

      var taskFn = function taskFn() {
        return new Promise(function (resolve) {
          numPolls += 1;
          setTimeout(function () {
            return resolve('w00t');
          }, 250);
        });
      };

      (0, _promisePoller.default)({
        taskFn: taskFn,
        masterTimeout: 500,
        retries: 10,
        shouldContinue: function shouldContinue() {
          return true;
        }
      }).then(function () {
        fail('Master promise was resolved, should have hit master timeout');
        done();
      }, function () {
        expect(numPolls).not.toBeGreaterThan(2);
        done();
      });
    });
  });
});