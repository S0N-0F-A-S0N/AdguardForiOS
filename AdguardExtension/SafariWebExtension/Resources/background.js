/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 7757:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(5666);


/***/ }),

/***/ 5666:
/***/ ((module) => {

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
   true ? module.exports : 0
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}


/***/ }),

/***/ 3150:
/***/ (function(module, exports) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [module], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else { var mod; }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (module) {
  /* webextension-polyfill - v0.8.0 - Tue Apr 20 2021 11:27:38 */

  /* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */

  /* vim: set sts=2 sw=2 et tw=80: */

  /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  "use strict";

  if (typeof browser === "undefined" || Object.getPrototypeOf(browser) !== Object.prototype) {
    const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
    const SEND_RESPONSE_DEPRECATION_WARNING = "Returning a Promise is the preferred way to send a reply from an onMessage/onMessageExternal listener, as the sendResponse will be removed from the specs (See https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)"; // Wrapping the bulk of this polyfill in a one-time-use function is a minor
    // optimization for Firefox. Since Spidermonkey does not fully parse the
    // contents of a function until the first time it's called, and since it will
    // never actually need to be called, this allows the polyfill to be included
    // in Firefox nearly for free.

    const wrapAPIs = extensionAPIs => {
      // NOTE: apiMetadata is associated to the content of the api-metadata.json file
      // at build time by replacing the following "include" with the content of the
      // JSON file.
      const apiMetadata = {
        "alarms": {
          "clear": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "clearAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "get": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "bookmarks": {
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getChildren": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getRecent": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getSubTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTree": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "browserAction": {
          "disable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "enable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "getBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getBadgeText": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "openPopup": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setBadgeText": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "browsingData": {
          "remove": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "removeCache": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCookies": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeDownloads": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeFormData": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeHistory": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeLocalStorage": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removePasswords": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removePluginData": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "settings": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "commands": {
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "contextMenus": {
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "cookies": {
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAllCookieStores": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "set": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "devtools": {
          "inspectedWindow": {
            "eval": {
              "minArgs": 1,
              "maxArgs": 2,
              "singleCallbackArg": false
            }
          },
          "panels": {
            "create": {
              "minArgs": 3,
              "maxArgs": 3,
              "singleCallbackArg": true
            },
            "elements": {
              "createSidebarPane": {
                "minArgs": 1,
                "maxArgs": 1
              }
            }
          }
        },
        "downloads": {
          "cancel": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "download": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "erase": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getFileIcon": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "open": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "pause": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeFile": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "resume": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "show": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "extension": {
          "isAllowedFileSchemeAccess": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "isAllowedIncognitoAccess": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "history": {
          "addUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "deleteRange": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getVisits": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "i18n": {
          "detectLanguage": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAcceptLanguages": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "identity": {
          "launchWebAuthFlow": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "idle": {
          "queryState": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "management": {
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getSelf": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setEnabled": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "uninstallSelf": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "notifications": {
          "clear": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPermissionLevel": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "pageAction": {
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "hide": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "show": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "permissions": {
          "contains": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "request": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "runtime": {
          "getBackgroundPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPlatformInfo": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "openOptionsPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "requestUpdateCheck": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "sendMessage": {
            "minArgs": 1,
            "maxArgs": 3
          },
          "sendNativeMessage": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "setUninstallURL": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "sessions": {
          "getDevices": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getRecentlyClosed": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "restore": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "storage": {
          "local": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          },
          "managed": {
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            }
          },
          "sync": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          }
        },
        "tabs": {
          "captureVisibleTab": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "detectLanguage": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "discard": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "duplicate": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "executeScript": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getZoom": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getZoomSettings": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "goBack": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "goForward": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "highlight": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "insertCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "query": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "reload": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "sendMessage": {
            "minArgs": 2,
            "maxArgs": 3
          },
          "setZoom": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "setZoomSettings": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "update": {
            "minArgs": 1,
            "maxArgs": 2
          }
        },
        "topSites": {
          "get": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "webNavigation": {
          "getAllFrames": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getFrame": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "webRequest": {
          "handlerBehaviorChanged": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "windows": {
          "create": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getLastFocused": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        }
      };

      if (Object.keys(apiMetadata).length === 0) {
        throw new Error("api-metadata.json has not been included in browser-polyfill");
      }
      /**
       * A WeakMap subclass which creates and stores a value for any key which does
       * not exist when accessed, but behaves exactly as an ordinary WeakMap
       * otherwise.
       *
       * @param {function} createItem
       *        A function which will be called in order to create the value for any
       *        key which does not exist, the first time it is accessed. The
       *        function receives, as its only argument, the key being created.
       */


      class DefaultWeakMap extends WeakMap {
        constructor(createItem, items = undefined) {
          super(items);
          this.createItem = createItem;
        }

        get(key) {
          if (!this.has(key)) {
            this.set(key, this.createItem(key));
          }

          return super.get(key);
        }

      }
      /**
       * Returns true if the given object is an object with a `then` method, and can
       * therefore be assumed to behave as a Promise.
       *
       * @param {*} value The value to test.
       * @returns {boolean} True if the value is thenable.
       */


      const isThenable = value => {
        return value && typeof value === "object" && typeof value.then === "function";
      };
      /**
       * Creates and returns a function which, when called, will resolve or reject
       * the given promise based on how it is called:
       *
       * - If, when called, `chrome.runtime.lastError` contains a non-null object,
       *   the promise is rejected with that value.
       * - If the function is called with exactly one argument, the promise is
       *   resolved to that value.
       * - Otherwise, the promise is resolved to an array containing all of the
       *   function's arguments.
       *
       * @param {object} promise
       *        An object containing the resolution and rejection functions of a
       *        promise.
       * @param {function} promise.resolve
       *        The promise's resolution function.
       * @param {function} promise.reject
       *        The promise's rejection function.
       * @param {object} metadata
       *        Metadata about the wrapped method which has created the callback.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function}
       *        The generated callback function.
       */


      const makeCallback = (promise, metadata) => {
        return (...callbackArgs) => {
          if (extensionAPIs.runtime.lastError) {
            promise.reject(new Error(extensionAPIs.runtime.lastError.message));
          } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
            promise.resolve(callbackArgs[0]);
          } else {
            promise.resolve(callbackArgs);
          }
        };
      };

      const pluralizeArguments = numArgs => numArgs == 1 ? "argument" : "arguments";
      /**
       * Creates a wrapper function for a method with the given name and metadata.
       *
       * @param {string} name
       *        The name of the method which is being wrapped.
       * @param {object} metadata
       *        Metadata about the method being wrapped.
       * @param {integer} metadata.minArgs
       *        The minimum number of arguments which must be passed to the
       *        function. If called with fewer than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {integer} metadata.maxArgs
       *        The maximum number of arguments which may be passed to the
       *        function. If called with more than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function(object, ...*)}
       *       The generated wrapper function.
       */


      const wrapAsyncFunction = (name, metadata) => {
        return function asyncFunctionWrapper(target, ...args) {
          if (args.length < metadata.minArgs) {
            throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
          }

          if (args.length > metadata.maxArgs) {
            throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
          }

          return new Promise((resolve, reject) => {
            if (metadata.fallbackToNoCallback) {
              // This API method has currently no callback on Chrome, but it return a promise on Firefox,
              // and so the polyfill will try to call it with a callback first, and it will fallback
              // to not passing the callback if the first call fails.
              try {
                target[name](...args, makeCallback({
                  resolve,
                  reject
                }, metadata));
              } catch (cbError) {
                console.warn(`${name} API method doesn't seem to support the callback parameter, ` + "falling back to call it without a callback: ", cbError);
                target[name](...args); // Update the API method metadata, so that the next API calls will not try to
                // use the unsupported callback anymore.

                metadata.fallbackToNoCallback = false;
                metadata.noCallback = true;
                resolve();
              }
            } else if (metadata.noCallback) {
              target[name](...args);
              resolve();
            } else {
              target[name](...args, makeCallback({
                resolve,
                reject
              }, metadata));
            }
          });
        };
      };
      /**
       * Wraps an existing method of the target object, so that calls to it are
       * intercepted by the given wrapper function. The wrapper function receives,
       * as its first argument, the original `target` object, followed by each of
       * the arguments passed to the original method.
       *
       * @param {object} target
       *        The original target object that the wrapped method belongs to.
       * @param {function} method
       *        The method being wrapped. This is used as the target of the Proxy
       *        object which is created to wrap the method.
       * @param {function} wrapper
       *        The wrapper function which is called in place of a direct invocation
       *        of the wrapped method.
       *
       * @returns {Proxy<function>}
       *        A Proxy object for the given method, which invokes the given wrapper
       *        method in its place.
       */


      const wrapMethod = (target, method, wrapper) => {
        return new Proxy(method, {
          apply(targetMethod, thisObj, args) {
            return wrapper.call(thisObj, target, ...args);
          }

        });
      };

      let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
      /**
       * Wraps an object in a Proxy which intercepts and wraps certain methods
       * based on the given `wrappers` and `metadata` objects.
       *
       * @param {object} target
       *        The target object to wrap.
       *
       * @param {object} [wrappers = {}]
       *        An object tree containing wrapper functions for special cases. Any
       *        function present in this object tree is called in place of the
       *        method in the same location in the `target` object tree. These
       *        wrapper methods are invoked as described in {@see wrapMethod}.
       *
       * @param {object} [metadata = {}]
       *        An object tree containing metadata used to automatically generate
       *        Promise-based wrapper functions for asynchronous. Any function in
       *        the `target` object tree which has a corresponding metadata object
       *        in the same location in the `metadata` tree is replaced with an
       *        automatically-generated wrapper function, as described in
       *        {@see wrapAsyncFunction}
       *
       * @returns {Proxy<object>}
       */

      const wrapObject = (target, wrappers = {}, metadata = {}) => {
        let cache = Object.create(null);
        let handlers = {
          has(proxyTarget, prop) {
            return prop in target || prop in cache;
          },

          get(proxyTarget, prop, receiver) {
            if (prop in cache) {
              return cache[prop];
            }

            if (!(prop in target)) {
              return undefined;
            }

            let value = target[prop];

            if (typeof value === "function") {
              // This is a method on the underlying object. Check if we need to do
              // any wrapping.
              if (typeof wrappers[prop] === "function") {
                // We have a special-case wrapper for this method.
                value = wrapMethod(target, target[prop], wrappers[prop]);
              } else if (hasOwnProperty(metadata, prop)) {
                // This is an async method that we have metadata for. Create a
                // Promise wrapper for it.
                let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                value = wrapMethod(target, target[prop], wrapper);
              } else {
                // This is a method that we don't know or care about. Return the
                // original method, bound to the underlying object.
                value = value.bind(target);
              }
            } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
              // This is an object that we need to do some wrapping for the children
              // of. Create a sub-object wrapper for it with the appropriate child
              // metadata.
              value = wrapObject(value, wrappers[prop], metadata[prop]);
            } else if (hasOwnProperty(metadata, "*")) {
              // Wrap all properties in * namespace.
              value = wrapObject(value, wrappers[prop], metadata["*"]);
            } else {
              // We don't need to do any wrapping for this property,
              // so just forward all access to the underlying object.
              Object.defineProperty(cache, prop, {
                configurable: true,
                enumerable: true,

                get() {
                  return target[prop];
                },

                set(value) {
                  target[prop] = value;
                }

              });
              return value;
            }

            cache[prop] = value;
            return value;
          },

          set(proxyTarget, prop, value, receiver) {
            if (prop in cache) {
              cache[prop] = value;
            } else {
              target[prop] = value;
            }

            return true;
          },

          defineProperty(proxyTarget, prop, desc) {
            return Reflect.defineProperty(cache, prop, desc);
          },

          deleteProperty(proxyTarget, prop) {
            return Reflect.deleteProperty(cache, prop);
          }

        }; // Per contract of the Proxy API, the "get" proxy handler must return the
        // original value of the target if that value is declared read-only and
        // non-configurable. For this reason, we create an object with the
        // prototype set to `target` instead of using `target` directly.
        // Otherwise we cannot return a custom object for APIs that
        // are declared read-only and non-configurable, such as `chrome.devtools`.
        //
        // The proxy handlers themselves will still use the original `target`
        // instead of the `proxyTarget`, so that the methods and properties are
        // dereferenced via the original targets.

        let proxyTarget = Object.create(target);
        return new Proxy(proxyTarget, handlers);
      };
      /**
       * Creates a set of wrapper functions for an event object, which handles
       * wrapping of listener functions that those messages are passed.
       *
       * A single wrapper is created for each listener function, and stored in a
       * map. Subsequent calls to `addListener`, `hasListener`, or `removeListener`
       * retrieve the original wrapper, so that  attempts to remove a
       * previously-added listener work as expected.
       *
       * @param {DefaultWeakMap<function, function>} wrapperMap
       *        A DefaultWeakMap object which will create the appropriate wrapper
       *        for a given listener function when one does not exist, and retrieve
       *        an existing one when it does.
       *
       * @returns {object}
       */


      const wrapEvent = wrapperMap => ({
        addListener(target, listener, ...args) {
          target.addListener(wrapperMap.get(listener), ...args);
        },

        hasListener(target, listener) {
          return target.hasListener(wrapperMap.get(listener));
        },

        removeListener(target, listener) {
          target.removeListener(wrapperMap.get(listener));
        }

      });

      const onRequestFinishedWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }
        /**
         * Wraps an onRequestFinished listener function so that it will return a
         * `getContent()` property which returns a `Promise` rather than using a
         * callback API.
         *
         * @param {object} req
         *        The HAR entry object representing the network request.
         */


        return function onRequestFinished(req) {
          const wrappedReq = wrapObject(req, {}
          /* wrappers */
          , {
            getContent: {
              minArgs: 0,
              maxArgs: 0
            }
          });
          listener(wrappedReq);
        };
      }); // Keep track if the deprecation warning has been logged at least once.

      let loggedSendResponseDeprecationWarning = false;
      const onMessageWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }
        /**
         * Wraps a message listener function so that it may send responses based on
         * its return value, rather than by returning a sentinel value and calling a
         * callback. If the listener function returns a Promise, the response is
         * sent when the promise either resolves or rejects.
         *
         * @param {*} message
         *        The message sent by the other end of the channel.
         * @param {object} sender
         *        Details about the sender of the message.
         * @param {function(*)} sendResponse
         *        A callback which, when called with an arbitrary argument, sends
         *        that value as a response.
         * @returns {boolean}
         *        True if the wrapped listener returned a Promise, which will later
         *        yield a response. False otherwise.
         */


        return function onMessage(message, sender, sendResponse) {
          let didCallSendResponse = false;
          let wrappedSendResponse;
          let sendResponsePromise = new Promise(resolve => {
            wrappedSendResponse = function (response) {
              if (!loggedSendResponseDeprecationWarning) {
                console.warn(SEND_RESPONSE_DEPRECATION_WARNING, new Error().stack);
                loggedSendResponseDeprecationWarning = true;
              }

              didCallSendResponse = true;
              resolve(response);
            };
          });
          let result;

          try {
            result = listener(message, sender, wrappedSendResponse);
          } catch (err) {
            result = Promise.reject(err);
          }

          const isResultThenable = result !== true && isThenable(result); // If the listener didn't returned true or a Promise, or called
          // wrappedSendResponse synchronously, we can exit earlier
          // because there will be no response sent from this listener.

          if (result !== true && !isResultThenable && !didCallSendResponse) {
            return false;
          } // A small helper to send the message if the promise resolves
          // and an error if the promise rejects (a wrapped sendMessage has
          // to translate the message into a resolved promise or a rejected
          // promise).


          const sendPromisedResult = promise => {
            promise.then(msg => {
              // send the message value.
              sendResponse(msg);
            }, error => {
              // Send a JSON representation of the error if the rejected value
              // is an instance of error, or the object itself otherwise.
              let message;

              if (error && (error instanceof Error || typeof error.message === "string")) {
                message = error.message;
              } else {
                message = "An unexpected error occurred";
              }

              sendResponse({
                __mozWebExtensionPolyfillReject__: true,
                message
              });
            }).catch(err => {
              // Print an error on the console if unable to send the response.
              console.error("Failed to send onMessage rejected reply", err);
            });
          }; // If the listener returned a Promise, send the resolved value as a
          // result, otherwise wait the promise related to the wrappedSendResponse
          // callback to resolve and send it as a response.


          if (isResultThenable) {
            sendPromisedResult(result);
          } else {
            sendPromisedResult(sendResponsePromise);
          } // Let Chrome know that the listener is replying.


          return true;
        };
      });

      const wrappedSendMessageCallback = ({
        reject,
        resolve
      }, reply) => {
        if (extensionAPIs.runtime.lastError) {
          // Detect when none of the listeners replied to the sendMessage call and resolve
          // the promise to undefined as in Firefox.
          // See https://github.com/mozilla/webextension-polyfill/issues/130
          if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
            resolve();
          } else {
            reject(new Error(extensionAPIs.runtime.lastError.message));
          }
        } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
          // Convert back the JSON representation of the error into
          // an Error instance.
          reject(new Error(reply.message));
        } else {
          resolve(reply);
        }
      };

      const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
        if (args.length < metadata.minArgs) {
          throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
        }

        if (args.length > metadata.maxArgs) {
          throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
        }

        return new Promise((resolve, reject) => {
          const wrappedCb = wrappedSendMessageCallback.bind(null, {
            resolve,
            reject
          });
          args.push(wrappedCb);
          apiNamespaceObj.sendMessage(...args);
        });
      };

      const staticWrappers = {
        devtools: {
          network: {
            onRequestFinished: wrapEvent(onRequestFinishedWrappers)
          }
        },
        runtime: {
          onMessage: wrapEvent(onMessageWrappers),
          onMessageExternal: wrapEvent(onMessageWrappers),
          sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
            minArgs: 1,
            maxArgs: 3
          })
        },
        tabs: {
          sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
            minArgs: 2,
            maxArgs: 3
          })
        }
      };
      const settingMetadata = {
        clear: {
          minArgs: 1,
          maxArgs: 1
        },
        get: {
          minArgs: 1,
          maxArgs: 1
        },
        set: {
          minArgs: 1,
          maxArgs: 1
        }
      };
      apiMetadata.privacy = {
        network: {
          "*": settingMetadata
        },
        services: {
          "*": settingMetadata
        },
        websites: {
          "*": settingMetadata
        }
      };
      return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
    };

    if (typeof chrome != "object" || !chrome || !chrome.runtime || !chrome.runtime.id) {
      throw new Error("This script should only be loaded in a browser extension.");
    } // The build process adds a UMD wrapper around this file, which makes the
    // `module` variable available.


    module.exports = wrapAPIs(chrome);
  } else {
    module.exports = browser;
  }
});
//# sourceMappingURL=browser-polyfill.js.map


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";

;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js
function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;

  var _s, _e;

  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/nonIterableRest.js
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js




function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}
// EXTERNAL MODULE: ./node_modules/@babel/runtime/regenerator/index.js
var regenerator = __webpack_require__(7757);
var regenerator_default = /*#__PURE__*/__webpack_require__.n(regenerator);
// EXTERNAL MODULE: ./node_modules/webextension-polyfill/dist/browser-polyfill.js
var browser_polyfill = __webpack_require__(3150);
var browser_polyfill_default = /*#__PURE__*/__webpack_require__.n(browser_polyfill);
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/classCallCheck.js
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/createClass.js
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}
;// CONCATENATED MODULE: ./src/pages/common/constants.ts
var MessagesToNativeApp;

(function (MessagesToNativeApp) {
  MessagesToNativeApp["GetInitData"] = "get_init_data";
  MessagesToNativeApp["GetContentScriptData"] = "get_content_script_data";
})(MessagesToNativeApp || (MessagesToNativeApp = {}));

var MessagesToBackgroundPage;

(function (MessagesToBackgroundPage) {
  MessagesToBackgroundPage["OpenAssistant"] = "open_assistant";
  MessagesToBackgroundPage["AddRule"] = "add_rule";
  MessagesToBackgroundPage["GetPopupData"] = "get_popup_data";
  MessagesToBackgroundPage["SetPermissionsModalViewed"] = "set_permissions_modal_viewed";
  MessagesToBackgroundPage["SetProtectionStatus"] = "set_protection_status";
  MessagesToBackgroundPage["DeleteUserRulesByUrl"] = "delete_user_rules_by_url";
  MessagesToBackgroundPage["ReportProblem"] = "report_problem";
  MessagesToBackgroundPage["UpgradeClicked"] = "upgrade_clicked";
  MessagesToBackgroundPage["EnableAdvancedBlocking"] = "enable_advanced_blocking";
  MessagesToBackgroundPage["EnableSafariProtection"] = "enable_safari_protection";
  MessagesToBackgroundPage["RequestContentScriptData"] = "request_content_script_data";
})(MessagesToBackgroundPage || (MessagesToBackgroundPage = {}));

var MessagesToContentScript;

(function (MessagesToContentScript) {
  MessagesToContentScript["InitAssistant"] = "init_assistant";
})(MessagesToContentScript || (MessagesToContentScript = {}));

var AppearanceTheme;

(function (AppearanceTheme) {
  AppearanceTheme["System"] = "system";
  AppearanceTheme["Dark"] = "dark";
  AppearanceTheme["Light"] = "light";
})(AppearanceTheme || (AppearanceTheme = {}));

var APPEARANCE_THEME_DEFAULT = AppearanceTheme.System;
var WEB_EXTENSION_MORE_URL = 'https://link.adtidy.org/forward.html?action=web_extension_more&from=popup&app=ios';
var Platform;

(function (Platform) {
  Platform["IPad"] = "ipad";
  Platform["IPhone"] = "iphone";
})(Platform || (Platform = {}));
;// CONCATENATED MODULE: ./src/pages/common/utils/url.ts
/**
 * Returns hostname from url.
 * Uses `URL` constructor to get hostname.
 *
 * Needed for getting correct cosmetic result for the current page,
 * e.g. used by getEngineCosmeticResult().
 *
 * @see {@link https://github.com/AdguardTeam/AdguardForiOS/issues/1897}
 *
 * @param url Url to get hostname from.
 * @returns Hostname.
 */
var getHostname = function getHostname(url) {
  var _URL = new URL(url),
      hostname = _URL.hostname;

  return hostname;
};
/**
 * Crops `www.` from the beginning of the hostname if it exists.
 * Otherwise returns hostname as is.
 *
 * @param hostname Hostname to crop.
 * @returns Cropped domain.
 */

var getCroppedDomain = function getCroppedDomain(hostname) {
  return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
};
/**
 * Returns domain name from url.
 * Uses `URL` constructor to get domain.
 *
 * Strips `www.` from the beginning of the domain if it exists,
 * e.g. used for disabling and enabling protection on the current site (allowlist).
 *
 * @param url Url to get domain from.
 * @returns Domain name.
 */

var getDomain = function getDomain(url) {
  var hostname = getHostname(url);
  return getCroppedDomain(hostname);
};
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/defineProperty.js
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}
;// CONCATENATED MODULE: ./src/pages/common/storage/Storage.ts






var Storage = /*#__PURE__*/_createClass(function Storage() {
  _classCallCheck(this, Storage);

  this.get = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee(key) {
      var data;
      return regenerator_default().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return browser_polyfill_default().storage.local.get(key);

          case 3:
            data = _context.sent;
            return _context.abrupt("return", data[key]);

          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](0);
            throw new Error("Error during storage access by path ".concat(key, ", e: ").concat(_context.t0));

          case 10:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[0, 7]]);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();

  this.set = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee2(key, data) {
      return regenerator_default().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return browser_polyfill_default().storage.local.set(_defineProperty({}, key, data));

          case 3:
            _context2.next = 8;
            break;

          case 5:
            _context2.prev = 5;
            _context2.t0 = _context2["catch"](0);
            throw new Error("Error during saving data to storage ".concat(key, ", e: ").concat(_context2.t0));

          case 8:
          case "end":
            return _context2.stop();
        }
      }, _callee2, null, [[0, 5]]);
    }));

    return function (_x2, _x3) {
      return _ref2.apply(this, arguments);
    };
  }();
});
;// CONCATENATED MODULE: ./src/pages/common/storage/index.ts

var storage = new Storage();
;// CONCATENATED MODULE: ./src/pages/background/native-host/NativeHost.ts






/* eslint-disable class-methods-use-this */




var NativeHost = /*#__PURE__*/function () {
  function NativeHost() {
    _classCallCheck(this, NativeHost);

    this.APP_ID = 'application_id';
    this.links = null;
    this.ACTION_LINKS_STORAGE_KEY = 'action_links';
    this.PLATFORM_STORAGE_KEY = 'platform';
    this.platform = Platform.IPhone;
  }

  _createClass(NativeHost, [{
    key: "sendNativeMessage",
    value:
    /**
     * Sends message to the native messaging host
     * @param type
     * @param data
     * @private
     */
    function () {
      var _sendNativeMessage = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee(type, data) {
        var message;
        return regenerator_default().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              message = {
                type: type
              };

              if (data) {
                message.data = data;
              }

              return _context.abrupt("return", browser_polyfill_default().runtime.sendNativeMessage(this.APP_ID, message));

            case 3:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));

      function sendNativeMessage(_x, _x2) {
        return _sendNativeMessage.apply(this, arguments);
      }

      return sendNativeMessage;
    }()
    /**
     * Return to the tab where user called an action
     * Without this method browser will move to the last open tab in the safari
     * @param tabIdToObserve - tab id which will be intercepted by ios app
     * @param tabIdToReturn - tab id where to return
     * @private
     */

  }, {
    key: "returnWhenTabIsIntercepted",
    value: function returnWhenTabIsIntercepted(tabIdToObserve, tabIdToReturn) {
      var removeHandler = /*#__PURE__*/function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee2(tabId) {
          return regenerator_default().wrap(function _callee2$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                if (!(tabId === tabIdToObserve)) {
                  _context2.next = 4;
                  break;
                }

                _context2.next = 3;
                return browser_polyfill_default().tabs.update(tabIdToReturn, {
                  active: true
                });

              case 3:
                browser_polyfill_default().tabs.onRemoved.removeListener(removeHandler);

              case 4:
              case "end":
                return _context2.stop();
            }
          }, _callee2);
        }));

        return function removeHandler(_x3) {
          return _ref.apply(this, arguments);
        };
      }();

      browser_polyfill_default().tabs.onRemoved.addListener(removeHandler);
    }
    /**
     * Opens tabs with special links, which are intercepted by ios app
     * @param link
     * @private
     */

  }, {
    key: "openNativeLink",
    value: function () {
      var _openNativeLink = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee3(link) {
        var _yield$browser$tabs$q, _yield$browser$tabs$q2, currentTab, tab, tabIdToReturn, tabIdToObserver;

        return regenerator_default().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return browser_polyfill_default().tabs.query({
                currentWindow: true,
                active: true
              });

            case 2:
              _yield$browser$tabs$q = _context3.sent;
              _yield$browser$tabs$q2 = _slicedToArray(_yield$browser$tabs$q, 1);
              currentTab = _yield$browser$tabs$q2[0];
              _context3.next = 7;
              return this.getPlatform();

            case 7:
              _context3.t0 = _context3.sent;
              _context3.t1 = Platform.IPad;

              if (!(_context3.t0 === _context3.t1)) {
                _context3.next = 13;
                break;
              }

              _context3.next = 12;
              return browser_polyfill_default().tabs.update(currentTab.id, {
                url: link
              });

            case 12:
              return _context3.abrupt("return");

            case 13:
              _context3.next = 15;
              return browser_polyfill_default().tabs.create({
                url: link
              });

            case 15:
              tab = _context3.sent;
              tabIdToReturn = currentTab === null || currentTab === void 0 ? void 0 : currentTab.id;
              tabIdToObserver = tab === null || tab === void 0 ? void 0 : tab.id;

              if (tabIdToReturn && tabIdToObserver) {
                this.returnWhenTabIsIntercepted(tabIdToObserver, tabIdToReturn);
              }

            case 19:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this);
      }));

      function openNativeLink(_x4) {
        return _openNativeLink.apply(this, arguments);
      }

      return openNativeLink;
    }()
  }, {
    key: "savePlatformInStorage",
    value: function () {
      var _savePlatformInStorage = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee4(platform) {
        return regenerator_default().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              return _context4.abrupt("return", storage.set(this.PLATFORM_STORAGE_KEY, platform));

            case 1:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this);
      }));

      function savePlatformInStorage(_x5) {
        return _savePlatformInStorage.apply(this, arguments);
      }

      return savePlatformInStorage;
    }()
  }, {
    key: "getPlatformFromStorage",
    value: function () {
      var _getPlatformFromStorage = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee5() {
        var platform;
        return regenerator_default().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return storage.get(this.PLATFORM_STORAGE_KEY);

            case 2:
              platform = _context5.sent;

              if (platform) {
                _context5.next = 5;
                break;
              }

              return _context5.abrupt("return", null);

            case 5:
              return _context5.abrupt("return", platform);

            case 6:
            case "end":
              return _context5.stop();
          }
        }, _callee5, this);
      }));

      function getPlatformFromStorage() {
        return _getPlatformFromStorage.apply(this, arguments);
      }

      return getPlatformFromStorage;
    }()
  }, {
    key: "getPlatform",
    value: function () {
      var _getPlatform = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee6() {
        return regenerator_default().wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              if (this.platform) {
                _context6.next = 7;
                break;
              }

              _context6.next = 3;
              return this.getPlatformFromStorage();

            case 3:
              _context6.t0 = _context6.sent;

              if (_context6.t0) {
                _context6.next = 6;
                break;
              }

              _context6.t0 = Platform.IPhone;

            case 6:
              this.platform = _context6.t0;

            case 7:
              return _context6.abrupt("return", this.platform);

            case 8:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this);
      }));

      function getPlatform() {
        return _getPlatform.apply(this, arguments);
      }

      return getPlatform;
    }()
    /**
     * Saves links in the storage
     * @param links
     */

  }, {
    key: "saveLinksInStorage",
    value: function () {
      var _saveLinksInStorage = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee7(links) {
        return regenerator_default().wrap(function _callee7$(_context7) {
          while (1) switch (_context7.prev = _context7.next) {
            case 0:
              return _context7.abrupt("return", storage.set(this.ACTION_LINKS_STORAGE_KEY, links));

            case 1:
            case "end":
              return _context7.stop();
          }
        }, _callee7, this);
      }));

      function saveLinksInStorage(_x6) {
        return _saveLinksInStorage.apply(this, arguments);
      }

      return saveLinksInStorage;
    }()
    /**
     * Retrieves links from storage
     */

  }, {
    key: "getLinksFromStorage",
    value: function () {
      var _getLinksFromStorage = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee8() {
        var links;
        return regenerator_default().wrap(function _callee8$(_context8) {
          while (1) switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return storage.get(this.ACTION_LINKS_STORAGE_KEY);

            case 2:
              links = _context8.sent;

              if (links) {
                _context8.next = 5;
                break;
              }

              return _context8.abrupt("return", null);

            case 5:
              return _context8.abrupt("return", links);

            case 6:
            case "end":
              return _context8.stop();
          }
        }, _callee8, this);
      }));

      function getLinksFromStorage() {
        return _getLinksFromStorage.apply(this, arguments);
      }

      return getLinksFromStorage;
    }()
    /**
     * Saves platform data received from native host
     * @param platform
     */

  }, {
    key: "setPlatform",
    value: function () {
      var _setPlatform = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee9(platform) {
        return regenerator_default().wrap(function _callee9$(_context9) {
          while (1) switch (_context9.prev = _context9.next) {
            case 0:
              this.platform = platform;
              _context9.next = 3;
              return this.savePlatformInStorage(this.platform);

            case 3:
            case "end":
              return _context9.stop();
          }
        }, _callee9, this);
      }));

      function setPlatform(_x7) {
        return _setPlatform.apply(this, arguments);
      }

      return setPlatform;
    }()
    /**
     * Saves action links received from native host
     * @param links
     */

  }, {
    key: "setLinks",
    value: function () {
      var _setLinks = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee10(links) {
        return regenerator_default().wrap(function _callee10$(_context10) {
          while (1) switch (_context10.prev = _context10.next) {
            case 0:
              this.links = links;
              _context10.next = 3;
              return this.saveLinksInStorage(this.links);

            case 3:
            case "end":
              return _context10.stop();
          }
        }, _callee10, this);
      }));

      function setLinks(_x8) {
        return _setLinks.apply(this, arguments);
      }

      return setLinks;
    }()
    /**
     * Returns links from memory or from storage;
     */

  }, {
    key: "getLinks",
    value: function () {
      var _getLinks = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee11() {
        return regenerator_default().wrap(function _callee11$(_context11) {
          while (1) switch (_context11.prev = _context11.next) {
            case 0:
              if (this.links) {
                _context11.next = 4;
                break;
              }

              _context11.next = 3;
              return this.getLinksFromStorage();

            case 3:
              this.links = _context11.sent;

            case 4:
              return _context11.abrupt("return", this.links);

            case 5:
            case "end":
              return _context11.stop();
          }
        }, _callee11, this);
      }));

      function getLinks() {
        return _getLinks.apply(this, arguments);
      }

      return getLinks;
    }()
    /**
     * Appends ruleText to the action link sent by native host,
     * and opens new tab with this link
     * @param ruleText
     */

  }, {
    key: "addToUserRules",
    value: function () {
      var _addToUserRules = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee12(ruleText) {
        var links, linkWithRule;
        return regenerator_default().wrap(function _callee12$(_context12) {
          while (1) switch (_context12.prev = _context12.next) {
            case 0:
              _context12.next = 2;
              return this.getLinks();

            case 2:
              links = _context12.sent;

              if (links !== null && links !== void 0 && links.addToBlocklistLink) {
                _context12.next = 5;
                break;
              }

              return _context12.abrupt("return");

            case 5:
              linkWithRule = links.addToBlocklistLink + encodeURIComponent(ruleText);
              _context12.next = 8;
              return this.openNativeLink(linkWithRule);

            case 8:
            case "end":
              return _context12.stop();
          }
        }, _callee12, this);
      }));

      function addToUserRules(_x9) {
        return _addToUserRules.apply(this, arguments);
      }

      return addToUserRules;
    }()
  }, {
    key: "enableProtection",
    value: function () {
      var _enableProtection = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee13(url) {
        var links, domain, linkWithDomain;
        return regenerator_default().wrap(function _callee13$(_context13) {
          while (1) switch (_context13.prev = _context13.next) {
            case 0:
              _context13.next = 2;
              return this.getLinks();

            case 2:
              links = _context13.sent;

              if (links !== null && links !== void 0 && links.enableSiteProtectionLink) {
                _context13.next = 5;
                break;
              }

              return _context13.abrupt("return");

            case 5:
              domain = getDomain(url);
              linkWithDomain = links.enableSiteProtectionLink + encodeURIComponent(domain);
              _context13.next = 9;
              return this.openNativeLink(linkWithDomain);

            case 9:
            case "end":
              return _context13.stop();
          }
        }, _callee13, this);
      }));

      function enableProtection(_x10) {
        return _enableProtection.apply(this, arguments);
      }

      return enableProtection;
    }()
  }, {
    key: "disableProtection",
    value: function () {
      var _disableProtection = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee14(url) {
        var links, domain, linkWithDomain;
        return regenerator_default().wrap(function _callee14$(_context14) {
          while (1) switch (_context14.prev = _context14.next) {
            case 0:
              _context14.next = 2;
              return this.getLinks();

            case 2:
              links = _context14.sent;

              if (links !== null && links !== void 0 && links.disableSiteProtectionLink) {
                _context14.next = 5;
                break;
              }

              return _context14.abrupt("return");

            case 5:
              domain = getDomain(url);
              linkWithDomain = links.disableSiteProtectionLink + encodeURIComponent(domain);
              _context14.next = 9;
              return this.openNativeLink(linkWithDomain);

            case 9:
            case "end":
              return _context14.stop();
          }
        }, _callee14, this);
      }));

      function disableProtection(_x11) {
        return _disableProtection.apply(this, arguments);
      }

      return disableProtection;
    }()
  }, {
    key: "enableSafariProtection",
    value: function () {
      var _enableSafariProtection = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee15(url) {
        var links, domain, linkWithDomain;
        return regenerator_default().wrap(function _callee15$(_context15) {
          while (1) switch (_context15.prev = _context15.next) {
            case 0:
              _context15.next = 2;
              return this.getLinks();

            case 2:
              links = _context15.sent;

              if (links !== null && links !== void 0 && links.enableSafariProtectionLink) {
                _context15.next = 5;
                break;
              }

              return _context15.abrupt("return");

            case 5:
              domain = getDomain(url);
              linkWithDomain = links.enableSafariProtectionLink + encodeURIComponent(domain);
              _context15.next = 9;
              return this.openNativeLink(linkWithDomain);

            case 9:
            case "end":
              return _context15.stop();
          }
        }, _callee15, this);
      }));

      function enableSafariProtection(_x12) {
        return _enableSafariProtection.apply(this, arguments);
      }

      return enableSafariProtection;
    }()
  }, {
    key: "removeUserRulesBySite",
    value: function () {
      var _removeUserRulesBySite = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee16(url) {
        var links, domain, linkWithDomain;
        return regenerator_default().wrap(function _callee16$(_context16) {
          while (1) switch (_context16.prev = _context16.next) {
            case 0:
              _context16.next = 2;
              return this.getLinks();

            case 2:
              links = _context16.sent;

              if (links !== null && links !== void 0 && links.removeAllBlocklistRulesLink) {
                _context16.next = 5;
                break;
              }

              return _context16.abrupt("return");

            case 5:
              domain = getDomain(url);
              linkWithDomain = links.removeAllBlocklistRulesLink + encodeURIComponent(domain);
              _context16.next = 9;
              return this.openNativeLink(linkWithDomain);

            case 9:
            case "end":
              return _context16.stop();
          }
        }, _callee16, this);
      }));

      function removeUserRulesBySite(_x13) {
        return _removeUserRulesBySite.apply(this, arguments);
      }

      return removeUserRulesBySite;
    }()
    /**
     * Opens tab with report problem link
     * reportProblemLink already contains url to the website
     */

  }, {
    key: "reportProblem",
    value: function () {
      var _reportProblem = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee17() {
        var links;
        return regenerator_default().wrap(function _callee17$(_context17) {
          while (1) switch (_context17.prev = _context17.next) {
            case 0:
              _context17.next = 2;
              return this.getLinks();

            case 2:
              links = _context17.sent;

              if (links !== null && links !== void 0 && links.reportProblemLink) {
                _context17.next = 5;
                break;
              }

              return _context17.abrupt("return");

            case 5:
              _context17.next = 7;
              return browser_polyfill_default().tabs.create({
                url: links.reportProblemLink
              });

            case 7:
            case "end":
              return _context17.stop();
          }
        }, _callee17, this);
      }));

      function reportProblem() {
        return _reportProblem.apply(this, arguments);
      }

      return reportProblem;
    }()
  }, {
    key: "upgradeMe",
    value: function () {
      var _upgradeMe = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee18() {
        var links;
        return regenerator_default().wrap(function _callee18$(_context18) {
          while (1) switch (_context18.prev = _context18.next) {
            case 0:
              _context18.next = 2;
              return this.getLinks();

            case 2:
              links = _context18.sent;

              if (links !== null && links !== void 0 && links.upgradeAppLink) {
                _context18.next = 5;
                break;
              }

              return _context18.abrupt("return");

            case 5:
              _context18.next = 7;
              return this.openNativeLink(links.upgradeAppLink);

            case 7:
            case "end":
              return _context18.stop();
          }
        }, _callee18, this);
      }));

      function upgradeMe() {
        return _upgradeMe.apply(this, arguments);
      }

      return upgradeMe;
    }()
  }, {
    key: "enableAdvancedBlocking",
    value: function () {
      var _enableAdvancedBlocking = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee19() {
        var links;
        return regenerator_default().wrap(function _callee19$(_context19) {
          while (1) switch (_context19.prev = _context19.next) {
            case 0:
              _context19.next = 2;
              return this.getLinks();

            case 2:
              links = _context19.sent;

              if (links !== null && links !== void 0 && links.enableAdvancedBlockingLink) {
                _context19.next = 5;
                break;
              }

              return _context19.abrupt("return");

            case 5:
              _context19.next = 7;
              return this.openNativeLink(links.enableAdvancedBlockingLink);

            case 7:
            case "end":
              return _context19.stop();
          }
        }, _callee19, this);
      }));

      function enableAdvancedBlocking() {
        return _enableAdvancedBlocking.apply(this, arguments);
      }

      return enableAdvancedBlocking;
    }()
  }, {
    key: "getInitData",
    value: function () {
      var _getInitData = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee20(url) {
        var result, protectionEnabled, hasUserRules, premiumApp, appearanceTheme, contentBlockersEnabled, advancedBlockingEnabled, allowlistInverted, platform, safariProtectionEnabled, enableSiteProtectionLink, disableSiteProtectionLink, addToBlocklistLink, removeAllBlocklistRulesLink, upgradeAppLink, reportProblemLink, enableAdvancedBlockingLink, enableSafariProtectionLink;
        return regenerator_default().wrap(function _callee20$(_context20) {
          while (1) switch (_context20.prev = _context20.next) {
            case 0:
              _context20.next = 2;
              return this.sendNativeMessage(MessagesToNativeApp.GetInitData, url);

            case 2:
              result = _context20.sent;
              protectionEnabled = result.protection_enabled, hasUserRules = result.has_user_rules, premiumApp = result.premium_app, appearanceTheme = result.appearance_theme, contentBlockersEnabled = result.content_blockers_enabled, advancedBlockingEnabled = result.advanced_blocking_enabled, allowlistInverted = result.allowlist_inverted, platform = result.platform, safariProtectionEnabled = result.safari_protection_enabled, enableSiteProtectionLink = result.enable_site_protection_link, disableSiteProtectionLink = result.disable_site_protection_link, addToBlocklistLink = result.add_to_blocklist_link, removeAllBlocklistRulesLink = result.remove_all_blocklist_rules_link, upgradeAppLink = result.upgrade_app_link, reportProblemLink = result.report_problem_link, enableAdvancedBlockingLink = result.enable_advanced_blocking_link, enableSafariProtectionLink = result.enable_safari_protection_link;
              _context20.next = 6;
              return this.setLinks({
                addToBlocklistLink: addToBlocklistLink,
                disableSiteProtectionLink: disableSiteProtectionLink,
                removeAllBlocklistRulesLink: removeAllBlocklistRulesLink,
                enableSiteProtectionLink: enableSiteProtectionLink,
                upgradeAppLink: upgradeAppLink,
                reportProblemLink: reportProblemLink,
                enableAdvancedBlockingLink: enableAdvancedBlockingLink,
                enableSafariProtectionLink: enableSafariProtectionLink
              });

            case 6:
              _context20.next = 8;
              return this.setPlatform(platform);

            case 8:
              return _context20.abrupt("return", {
                appearanceTheme: appearanceTheme,
                contentBlockersEnabled: contentBlockersEnabled,
                hasUserRules: hasUserRules,
                premiumApp: premiumApp,
                protectionEnabled: protectionEnabled,
                advancedBlockingEnabled: advancedBlockingEnabled,
                allowlistInverted: allowlistInverted,
                platform: platform,
                safariProtectionEnabled: safariProtectionEnabled
              });

            case 9:
            case "end":
              return _context20.stop();
          }
        }, _callee20, this);
      }));

      function getInitData(_x14) {
        return _getInitData.apply(this, arguments);
      }

      return getInitData;
    }()
  }, {
    key: "getContentScriptData",
    value: function () {
      var _getContentScriptData = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee21(url, topUrl) {
        var result;
        return regenerator_default().wrap(function _callee21$(_context21) {
          while (1) switch (_context21.prev = _context21.next) {
            case 0:
              _context21.next = 2;
              return this.sendNativeMessage(MessagesToNativeApp.GetContentScriptData, {
                url: url,
                topUrl: topUrl
              });

            case 2:
              result = _context21.sent;
              return _context21.abrupt("return", result);

            case 4:
            case "end":
              return _context21.stop();
          }
        }, _callee21, this);
      }));

      function getContentScriptData(_x15, _x16) {
        return _getContentScriptData.apply(this, arguments);
      }

      return getContentScriptData;
    }()
  }]);

  return NativeHost;
}();
;// CONCATENATED MODULE: ./src/pages/background/native-host/index.ts

var nativeHost = new NativeHost();
;// CONCATENATED MODULE: ./src/pages/background/native-host/nativeHostMock.ts





function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }



/* eslint-disable no-console,class-methods-use-this */




var sleep = function sleep(timeout) {
  return new Promise(function (resolve) {
    setTimeout(resolve, timeout);
  });
};
/**
 * Represents application state.
 */


var NativeHostMock = /*#__PURE__*/function () {
  function NativeHostMock() {
    var _this = this;

    _classCallCheck(this, NativeHostMock);

    this.DEFAULT_APPLICATION_STATE = {
      appearanceTheme: APPEARANCE_THEME_DEFAULT,
      platform: Platform.IPad,
      premiumApp: true,
      advancedBlockingEnabled: true,
      safariProtectionEnabled: true,
      contentBlockersEnabled: true,
      allowlistInverted: false
    };
    this.DEFAULT_WEBSITE_STATE = {
      protectionEnabled: true,
      hasUserRules: false
    };

    /**
     * Current application state.
     */
    this.applicationState = this.DEFAULT_APPLICATION_STATE;

    /**
     * Holds websites state. If state for the domain is not found, uses
     * DEFAULT_WEBSITE_STATE.
     */
    this.websites = new Map();

    /**
     * Helper function that is required to mock slow async functions.
     *
     * @param result result to return.
     * @returns Promise with the result.
     */
    this.withSleep = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee(result) {
        return regenerator_default().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return sleep(1000);

            case 2:
              return _context.abrupt("return", result);

            case 3:
            case "end":
              return _context.stop();
          }
        }, _callee);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }();

    /**
     * Helper function that opens a URL in a new tab and prints
     * the specified string on the page
     *
     * @param text string to print on the page.
     */
    this.openLinkToAction = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee2(text) {
        var encodedText, url;
        return regenerator_default().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              console.log('openLinkToAction', text);
              encodedText = btoa("[mock action] ".concat(text));
              url = "https://httpbin.agrd.dev/base64/decode/".concat(encodedText);
              _context2.next = 5;
              return browser_polyfill_default().tabs.create({
                url: url
              });

            case 5:
              _context2.next = 7;
              return _this.withSleep();

            case 7:
            case "end":
              return _context2.stop();
          }
        }, _callee2);
      }));

      return function (_x2) {
        return _ref2.apply(this, arguments);
      };
    }();

    this.enableProtection = /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee3(url) {
        var domain, websiteState;
        return regenerator_default().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              console.log('enableProtection', url);
              domain = getDomain(url);
              websiteState = _this.websites.get(domain) || _this.DEFAULT_WEBSITE_STATE;
              websiteState.protectionEnabled = true;

              _this.websites.set(domain, websiteState);

              return _context3.abrupt("return", _this.openLinkToAction("enable site protection: ".concat(url)));

            case 6:
            case "end":
              return _context3.stop();
          }
        }, _callee3);
      }));

      return function (_x3) {
        return _ref3.apply(this, arguments);
      };
    }();

    this.disableProtection = /*#__PURE__*/function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee4(url) {
        var domain, websiteState;
        return regenerator_default().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              console.log('disableProtection', url);
              domain = getDomain(url);
              websiteState = _this.websites.get(domain) || _this.DEFAULT_WEBSITE_STATE;
              websiteState.protectionEnabled = false;

              _this.websites.set(domain, websiteState);

              return _context4.abrupt("return", _this.openLinkToAction("disable site protection: ".concat(url)));

            case 6:
            case "end":
              return _context4.stop();
          }
        }, _callee4);
      }));

      return function (_x4) {
        return _ref4.apply(this, arguments);
      };
    }();

    this.removeUserRulesBySite = /*#__PURE__*/function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee5(url) {
        var domain, websiteState;
        return regenerator_default().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              console.log('removeUserRulesBySite', url);
              domain = getDomain(url);
              websiteState = _this.websites.get(domain) || _this.DEFAULT_WEBSITE_STATE;
              websiteState.hasUserRules = false;

              _this.websites.set(domain, websiteState);

              return _context5.abrupt("return", _this.openLinkToAction("remove user rules by site: ".concat(url)));

            case 6:
            case "end":
              return _context5.stop();
          }
        }, _callee5);
      }));

      return function (_x5) {
        return _ref5.apply(this, arguments);
      };
    }();
  }

  _createClass(NativeHostMock, [{
    key: "getInitData",
    value: function () {
      var _getInitData = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee6(url) {
        var appState, domain, websiteState, initData;
        return regenerator_default().wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              console.log('getInitData', url);
              appState = this.applicationState;
              domain = getDomain(url);
              websiteState = this.websites.get(domain) || this.DEFAULT_WEBSITE_STATE;
              initData = _objectSpread(_objectSpread({}, appState), websiteState);
              return _context6.abrupt("return", this.withSleep(initData));

            case 6:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this);
      }));

      function getInitData(_x6) {
        return _getInitData.apply(this, arguments);
      }

      return getInitData;
    }()
  }, {
    key: "getContentScriptData",
    value: function () {
      var _getContentScriptData = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee7(url, topUrl) {
        var contentScriptData;
        return regenerator_default().wrap(function _callee7$(_context7) {
          while (1) switch (_context7.prev = _context7.next) {
            case 0:
              console.log('getContentScriptData', url, topUrl);
              contentScriptData = {
                configuration: {
                  css: [],
                  extendedCss: [],
                  js: ['console.log("Content script loaded")'],
                  scriptlets: [],
                  engineTimestamp: 0
                },
                init_ts: Date.now(),
                request_received_ts: Date.now(),
                response_created_ts: Date.now()
              };
              return _context7.abrupt("return", contentScriptData);

            case 3:
            case "end":
              return _context7.stop();
          }
        }, _callee7);
      }));

      function getContentScriptData(_x7, _x8) {
        return _getContentScriptData.apply(this, arguments);
      }

      return getContentScriptData;
    }()
  }, {
    key: "enableSafariProtection",
    value: function enableSafariProtection(url) {
      console.log('enableSafariProtection', url);
      var domain = getDomain(url);
      var websiteState = this.websites.get(domain) || this.DEFAULT_WEBSITE_STATE;
      websiteState.protectionEnabled = true;
      this.websites.set(domain, websiteState);
      return this.openLinkToAction("enable safari protection: ".concat(url));
    }
  }, {
    key: "enableAdvancedBlocking",
    value: function enableAdvancedBlocking() {
      console.log('enableAdvancedBlocking');
      return this.openLinkToAction('enable advanced blocking');
    }
  }, {
    key: "addToUserRules",
    value: function addToUserRules(ruleText) {
      console.log('addToUserRules', ruleText);
      var domain = ruleText.split('##')[0];
      var websiteState = this.websites.get(domain) || this.DEFAULT_WEBSITE_STATE;
      websiteState.hasUserRules = true;
      this.websites.set(domain, websiteState);
      return this.openLinkToAction("add user rule: ".concat(ruleText));
    }
  }, {
    key: "reportProblem",
    value: function reportProblem(url) {
      console.log('reportProblem', url);
      return this.openLinkToAction("report problem: ".concat(url));
    }
  }, {
    key: "upgradeMe",
    value: function upgradeMe() {
      console.log('upgradeMe');
      return this.openLinkToAction('upgrade me');
    }
  }]);

  return NativeHostMock;
}();

var nativeHostMock = new NativeHostMock();
;// CONCATENATED MODULE: ./src/pages/background/adguard.ts





var AdGuard = /*#__PURE__*/function () {
  function AdGuard() {
    _classCallCheck(this, AdGuard);

    this.mockNativeHost = false;
  }

  _createClass(AdGuard, [{
    key: "nativeHost",
    get: function get() {
      if (this.mockNativeHost) {
        return nativeHostMock;
      }

      return nativeHost;
    }
  }]);

  return AdGuard;
}();

var adguard = new AdGuard();
// @ts-ignore
__webpack_require__.g.adguard = adguard;
;// CONCATENATED MODULE: ./src/pages/background/engine.ts





/**
 * Engine is a class that handles the communication between the background
 * script and the native host, retrieves content script configuration from
 * there and caches it in the background.
 */

var Engine = /*#__PURE__*/_createClass(function Engine() {
  var _this = this;

  _classCallCheck(this, Engine);

  /**
   * Global variable to track the engine timestamp. This value is used to
   * invalidate the cache when the underlying engine is updated.
   */
  this.engineTimestamp = 0;

  /**
   * Cache to store the rules for a given URL. The key is a URL (string) and
   * the value is a ContentScriptData object. Caching responses allows us to
   * respond to content script requests quickly while also updating the cache
   * in the background.
   */
  this.cache = new Map();

  /**
   * Returns a cache key for the given URL and top-level URL.
   */
  this.cacheKey = function (url, topUrl) {
    return "".concat(url, "#").concat(topUrl !== null && topUrl !== void 0 ? topUrl : '');
  };

  /**
   * Retrieves the configuration for the content script that is running on
   * the specified url from the native process. Stores the retrieved
   * configuration in the cache.
   *
   * @param url URL of the website.
   * @param topUrl URL of the top-level website.
   * @returns The configuration for the content script.
   */
  this.lookupNative = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee(url, topUrl) {
      var data, configuration, key;
      return regenerator_default().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return adguard.nativeHost.getContentScriptData(url, topUrl);

          case 2:
            data = _context.sent;
            configuration = data.configuration; // If the engine timestamp has been updated, clear the cache and update
            // the timestamp.

            if (configuration && configuration.engineTimestamp !== _this.engineTimestamp) {
              _this.cache.clear();

              _this.engineTimestamp = configuration.engineTimestamp;
            } // Save the new message in the cache for the given URL.


            key = _this.cacheKey(url, topUrl);

            _this.cache.set(key, data);

            return _context.abrupt("return", data);

          case 8:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }();

  /**
   * Retrieves the configuration for the content script that is running on
   * the specified url. topUrl is only set when the url is an iframe.
   *
   * @param url URL of the website.
   * @param topUrl URL of the top-level website.
   */
  this.lookup = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee2(url, topUrl) {
      var cacheKey, cachedData, data;
      return regenerator_default().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            cacheKey = _this.cacheKey(url, topUrl);
            cachedData = _this.cache.get(cacheKey); // If the data is already cached, return it.

            if (!cachedData) {
              _context2.next = 6;
              break;
            }

            // Fire off a new request to update the cache in the background.
            _this.lookupNative(url, topUrl); // Mark response as cached.


            cachedData.cached = true;
            return _context2.abrupt("return", cachedData);

          case 6:
            _context2.next = 8;
            return _this.lookupNative(url, topUrl);

          case 8:
            data = _context2.sent;
            return _context2.abrupt("return", data);

          case 10:
          case "end":
            return _context2.stop();
        }
      }, _callee2);
    }));

    return function (_x3, _x4) {
      return _ref2.apply(this, arguments);
    };
  }();
});

var engine = new Engine();
;// CONCATENATED MODULE: ./src/pages/background/app.ts





/* eslint-disable class-methods-use-this */



var App = /*#__PURE__*/function () {
  function App() {
    var _this = this;

    _classCallCheck(this, App);

    this.PERMISSIONS_MODAL_VIEWED = 'permissions_modal_viewed';
    // TODO extract all storage keys in common scheme
    this.isPermissionsModalViewed = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee() {
      var permissionsModalViewed;
      return regenerator_default().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return storage.get(_this.PERMISSIONS_MODAL_VIEWED);

          case 2:
            permissionsModalViewed = _context.sent;
            return _context.abrupt("return", !!permissionsModalViewed);

          case 4:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    this.setPermissionsModalViewed = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee2() {
      return regenerator_default().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return storage.set(_this.PERMISSIONS_MODAL_VIEWED, true);

          case 2:
          case "end":
            return _context2.stop();
        }
      }, _callee2);
    }));
  }

  _createClass(App, [{
    key: "manifest",
    get: function get() {
      return browser_polyfill_default().runtime.getManifest();
    }
  }, {
    key: "version",
    get: function get() {
      return this.manifest.version;
    }
  }]);

  return App;
}();

var app = new App();
;// CONCATENATED MODULE: ./src/pages/background/permissions.ts

/**
 * Function returns true when permissions for all sites were allowed, otherwise false
 * If non-existing websites allowed, then all sites were allowed
 */

var areAllSitesAllowed = function areAllSitesAllowed() {
  var NON_EXISTING_DOMAINS = ['http://non-existing-domain.com/', 'https://another-non-existing-domain.com/'];
  return browser_polyfill_default().permissions.contains({
    origins: NON_EXISTING_DOMAINS
  });
};

var permissions = {
  areAllSitesAllowed: areAllSitesAllowed
};
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/typeof.js
function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}
;// CONCATENATED MODULE: ./src/pages/common/log.ts




/* eslint-disable class-methods-use-this,no-console */
// TODO: add enum for levels 'INFO', 'DEBUG', 'ERROR'

/**
 * Redefine if you need it
*/
var DEFAULT_LEVEL = 'INFO';
var CONSOLE_METHODS = {
  LOG: 'log',
  INFO: 'info',
  ERROR: 'error'
};
var LEVELS = {
  ERROR: 1,
  INFO: 2,
  DEBUG: 3
};
/**
 * Simple logger with log levels
 */

var Log = /*#__PURE__*/function () {
  function Log() {
    _classCallCheck(this, Log);

    this.currentLevel = DEFAULT_LEVEL;
  }

  _createClass(Log, [{
    key: "errorToString",
    value:
    /**
     * Pretty-print javascript error
     */
    function errorToString(error) {
      return "".concat(error.toString(), "\nStack trace:\n").concat(error.stack);
    }
    /**
     * Formats date to local time string
     * @param date
     */

  }, {
    key: "getLocalTimeString",
    value: function getLocalTimeString(date) {
      var ONE_MINUTE_MS = 60 * 1000;
      var timeZoneOffsetMs = date.getTimezoneOffset() * ONE_MINUTE_MS;
      var localTime = new Date(date.getTime() - timeZoneOffsetMs);
      return localTime.toISOString().replace('Z', '');
    }
    /**
     * Sets logging level `DEBUG`.
     */

  }, {
    key: "setLevelDebug",
    value: function setLevelDebug() {
      this.currentLevel = 'DEBUG';
    }
    /**
     * Prints log message
     */

  }, {
    key: "print",
    value: function print(level, method, args) {
      var _this = this;

      // check log level
      if (LEVELS[this.currentLevel] < LEVELS[level]) {
        return;
      }

      if (!args || args.length === 0 || !args[0]) {
        return;
      }

      var formatted = args.map(function (arg) {
        if (typeof arg !== 'undefined') {
          var value = arg;

          if (value instanceof Error) {
            value = _this.errorToString(value);
          } else if (value && value.message) {
            value = value.message;
          } else if (_typeof(value) === 'object') {
            value = JSON.stringify(value, null, 4);
          }

          return value;
        }

        return arg;
      }).join(' ');
      var timestamp = "[".concat(new Date().toISOString(), "]");
      console[method](timestamp, formatted);
    }
  }, {
    key: "debug",
    value: function debug() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      this.print('DEBUG', 'log', args);
    }
  }, {
    key: "info",
    value: function info() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      this.print('INFO', 'info', args);
    }
  }, {
    key: "error",
    value: function error() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      this.print('ERROR', 'error', args);
    }
  }]);

  return Log;
}();

var log = new Log();
;// CONCATENATED MODULE: ./src/pages/background/background.ts




/* eslint-disable consistent-return */








/**
 * Handles messages from the content script.
 */
var handleMessages = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regenerator_default().mark(function _callee(message, sender) {
    var type, data, tabId, _yield$browser$tabs$q3, _yield$browser$tabs$q4, tab, url, allSitesAllowed, permissionsModalViewed, _yield$adguard$native2, protectionEnabled, hasUserRules, premiumApp, appearanceTheme, contentBlockersEnabled, advancedBlockingEnabled, safariProtectionEnabled, allowlistInverted, platform, enabled, _url, _url2, _url3, _url4, _sender$tab, topUrl, _url5;

    return regenerator_default().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          type = message.type, data = message.data;
          _context.t0 = type;
          _context.next = _context.t0 === MessagesToBackgroundPage.AddRule ? 4 : _context.t0 === MessagesToBackgroundPage.OpenAssistant ? 7 : _context.t0 === MessagesToBackgroundPage.SetPermissionsModalViewed ? 23 : _context.t0 === MessagesToBackgroundPage.GetPopupData ? 24 : _context.t0 === MessagesToBackgroundPage.SetProtectionStatus ? 44 : _context.t0 === MessagesToBackgroundPage.EnableSafariProtection ? 48 : _context.t0 === MessagesToBackgroundPage.ReportProblem ? 50 : _context.t0 === MessagesToBackgroundPage.UpgradeClicked ? 52 : _context.t0 === MessagesToBackgroundPage.EnableAdvancedBlocking ? 55 : _context.t0 === MessagesToBackgroundPage.DeleteUserRulesByUrl ? 58 : _context.t0 === MessagesToBackgroundPage.RequestContentScriptData ? 62 : 70;
          break;

        case 4:
          _context.next = 6;
          return adguard.nativeHost.addToUserRules(data.ruleText);

        case 6:
          return _context.abrupt("break", 71);

        case 7:
          tabId = data.tabId;

          if (tabId) {
            _context.next = 18;
            break;
          }

          _context.next = 11;
          return browser_polyfill_default().tabs.query({
            active: true,
            currentWindow: true
          });

        case 11:
          _yield$browser$tabs$q3 = _context.sent;
          _yield$browser$tabs$q4 = _slicedToArray(_yield$browser$tabs$q3, 1);
          tab = _yield$browser$tabs$q4[0];

          if (tab.id) {
            _context.next = 17;
            break;
          }

          log.error('Was unable to get active tab');
          return _context.abrupt("return");

        case 17:
          tabId = tab.id;

        case 18:
          _context.next = 20;
          return browser_polyfill_default().tabs.executeScript(tabId, {
            file: 'assistant.js'
          });

        case 20:
          _context.next = 22;
          return browser_polyfill_default().tabs.sendMessage(tabId, {
            type: MessagesToContentScript.InitAssistant,
            data: {
              addRuleCallbackName: MessagesToBackgroundPage.AddRule
            }
          });

        case 22:
          return _context.abrupt("break", 71);

        case 23:
          return _context.abrupt("return", app.setPermissionsModalViewed());

        case 24:
          url = data.url;
          _context.next = 27;
          return permissions.areAllSitesAllowed();

        case 27:
          allSitesAllowed = _context.sent;
          _context.next = 30;
          return app.isPermissionsModalViewed();

        case 30:
          permissionsModalViewed = _context.sent;
          _context.next = 33;
          return adguard.nativeHost.getInitData(url);

        case 33:
          _yield$adguard$native2 = _context.sent;
          protectionEnabled = _yield$adguard$native2.protectionEnabled;
          hasUserRules = _yield$adguard$native2.hasUserRules;
          premiumApp = _yield$adguard$native2.premiumApp;
          appearanceTheme = _yield$adguard$native2.appearanceTheme;
          contentBlockersEnabled = _yield$adguard$native2.contentBlockersEnabled;
          advancedBlockingEnabled = _yield$adguard$native2.advancedBlockingEnabled;
          safariProtectionEnabled = _yield$adguard$native2.safariProtectionEnabled;
          allowlistInverted = _yield$adguard$native2.allowlistInverted;
          platform = _yield$adguard$native2.platform;
          return _context.abrupt("return", {
            allSitesAllowed: allSitesAllowed,
            permissionsModalViewed: permissionsModalViewed,
            protectionEnabled: protectionEnabled,
            hasUserRules: hasUserRules,
            premiumApp: premiumApp,
            appearanceTheme: appearanceTheme,
            contentBlockersEnabled: contentBlockersEnabled,
            advancedBlockingEnabled: advancedBlockingEnabled,
            safariProtectionEnabled: safariProtectionEnabled,
            allowlistInverted: allowlistInverted,
            platform: platform
          });

        case 44:
          enabled = data.enabled, _url = data.url;

          if (!enabled) {
            _context.next = 47;
            break;
          }

          return _context.abrupt("return", adguard.nativeHost.enableProtection(_url));

        case 47:
          return _context.abrupt("return", adguard.nativeHost.disableProtection(_url));

        case 48:
          _url2 = data.url;
          return _context.abrupt("return", adguard.nativeHost.enableSafariProtection(_url2));

        case 50:
          _url3 = data.url;
          return _context.abrupt("return", adguard.nativeHost.reportProblem(_url3));

        case 52:
          _context.next = 54;
          return adguard.nativeHost.upgradeMe();

        case 54:
          return _context.abrupt("break", 71);

        case 55:
          _context.next = 57;
          return adguard.nativeHost.enableAdvancedBlocking();

        case 57:
          return _context.abrupt("break", 71);

        case 58:
          _url4 = data.url;
          _context.next = 61;
          return adguard.nativeHost.removeUserRulesBySite(_url4);

        case 61:
          return _context.abrupt("break", 71);

        case 62:
          topUrl = sender.frameId === 0 ? undefined : (_sender$tab = sender.tab) === null || _sender$tab === void 0 ? void 0 : _sender$tab.url;
          _url5 = sender.url;

          if (_url5) {
            _context.next = 68;
            break;
          }

          return _context.abrupt("break", 71);

        case 68:
          if (!_url5.startsWith('http') && topUrl) {
            // Handle the case of non-HTTP iframes, i.e. frames created by JS.
            // For instance, frames can be created as 'about:blank' or 'data:text/html'
            _url5 = topUrl;
          }

        case 69:
          return _context.abrupt("return", engine.lookup(_url5, topUrl));

        case 70:
          return _context.abrupt("break", 71);

        case 71:
          return _context.abrupt("return", null);

        case 72:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));

  return function handleMessages(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var background = function background() {
  // Message listener should be on the upper level to wake up background page
  // when it is necessary.
  browser_polyfill_default().runtime.onMessage.addListener(handleMessages);
};
;// CONCATENATED MODULE: ./src/pages/background/index.ts

;// CONCATENATED MODULE: ./src/targets/background/index.ts

background();
})();

/******/ })()
;