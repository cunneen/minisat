// stubs for Meteor API to make TinyTest happy without Meteor available.
const EJSON = require("ejson");
const Random = require("@reactioncommerce/random");

// no-op function
const _noop = () => { };

const meteorEnv = {
    NODE_ENV: process.env.NODE_ENV || "production",
    TEST_METADATA: process.env.TEST_METADATA || "{}"
};

const config = typeof __meteor_runtime_config__ === "object" &&
    __meteor_runtime_config__;

if (config) {
    config.meteorEnv = meteorEnv;
}

const Meteor = {
    isProduction: meteorEnv.NODE_ENV === "production",
    isDevelopment: meteorEnv.NODE_ENV !== "production",
    isCordova: false,
    isModern: true,

    isClient: true,
    isServer: false,
    _SynchronousQueue: () => _noop,
    setTimeout: _noop,
    methods: _noop,
    callAsync: _noop,
    call: _noop,

};

Meteor.settings = {};

if (process.env.METEOR_SETTINGS) {
    try {
        Meteor.settings = JSON.parse(process.env.METEOR_SETTINGS);
    } catch (e) {
        throw new Error("METEOR_SETTINGS are not valid JSON.");
    }
}

// Make sure that there is always a public attribute
// to enable Meteor.settings.public on client
if (!Meteor.settings.public) {
    Meteor.settings.public = {};
}

// Push a subset of settings to the client.  Note that the way this
// code is written, if the app mutates `Meteor.settings.public` on the
// server, it also mutates
// `__meteor_runtime_config__.PUBLIC_SETTINGS`, and the modified
// settings will be sent to the client.
if (config) {
    config.PUBLIC_SETTINGS = Meteor.settings.public;
}

if (config && config.gitCommitHash) {
    Meteor.gitCommitHash = config.gitCommitHash;
}

// === copied from https://github.com/meteor/meteor/blob/master/packages/meteor/dynamics_browser.js

// Simple implementation of dynamic scoping, for use in browsers

var nextSlot = 0;
var currentValues = [];
var callAsyncMethodRunning = false;

Meteor.EnvironmentVariable = function () {
    this.slot = nextSlot++;
};

var EVp = Meteor.EnvironmentVariable.prototype;

EVp.getCurrentValues = function () {
    return currentValues;
};
/**
 * @memberof Meteor.EnvironmentVariable
 * @method get
 * @returns {any} The current value of the variable, or its default value if
 */
EVp.get = function () {
    return currentValues[this.slot];
};

EVp.getOrNullIfOutsideFiber = function () {
    return this.get();
};


/**
 * @memberof Meteor.EnvironmentVariable
 * @method withValue
 * @param {any} value The value to set for the duration of the function call
 * @param {Function} func The function to call with the new value of the
 * @returns {any} The return value of the function
 */
EVp.withValue = function (value, func) {
    // WARNING: Do not change the behavior of this function.
    // If you compare this function to it's version in the server-side, you'll see that there we handle async results.
    // In the client we don't need to do this. If we try to, it can lead to problems like this:
    // https://github.com/meteor/meteor/pull/13198#issuecomment-2181254734/.
    var saved = currentValues[this.slot];

    try {
        currentValues[this.slot] = value;

        return func();
    } finally {
        currentValues[this.slot] = saved;
    }
};

EVp._set = function (context) {
    currentValues[this.slot] = context;
};

EVp._setNewContextAndGetCurrent = function (value) {
    var saved = currentValues[this.slot];
    this._set(value);
    return saved;
};

EVp._isCallAsyncMethodRunning = function () {
    return callAsyncMethodRunning;
};

EVp._setCallAsyncMethodRunning = function (value) {
    callAsyncMethodRunning = value;
};


Meteor.bindEnvironment = function (func, onException, _this) {
    // needed in order to be able to create closures inside func and
    // have the closed variables not change back to their original
    // values
    var boundValues = currentValues.slice();

    if (!onException || typeof (onException) === 'string') {
        var description = onException || "callback of async function";
        onException = function (error) {
            Meteor._debug(
                "Exception in " + description + ":",
                error
            );
        };
    }

    return function (/* arguments */) {
        var savedValues = currentValues;
        try {
            currentValues = boundValues;
            var ret = func.apply(_this, arguments);
        } catch (e) {
            // note: callback-hook currently relies on the fact that if onException
            // throws in the browser, the wrapped call throws.
            onException(e);
        } finally {
            currentValues = savedValues;
        }
        return ret;
    };
};

// === end copied from https://github.com/meteor/meteor/blob/master/packages/meteor/dynamics_browser.js


// ==== copied from https://github.com/meteor/meteor/blob/master/packages/meteor/helpers.js
if (typeof __meteor_runtime_config__ === 'object' &&
    __meteor_runtime_config__.meteorRelease) {
    /**
     * @summary `Meteor.release` is a string containing the name of the [release](#meteorupdate) with which the project was built (for example, `"1.2.3"`). It is `undefined` if the project was built using a git checkout of Meteor.
     * @locus Anywhere
     * @type {String}
     */
    Meteor.release = __meteor_runtime_config__.meteorRelease;
}

// XXX find a better home for these? Ideally they would be _.get,
// _.ensure, _.delete..

// _get(a,b,c,d) returns a[b][c][d], or else undefined if a[b] or
// a[b][c] doesn't exist.
//
Meteor._get = function (obj /*, arguments */) {
    for (var i = 1; i < arguments.length; i++) {
        if (!(arguments[i] in obj))
            return undefined;
        obj = obj[arguments[i]];
    }
    return obj;
};

// _ensure(a,b,c,d) ensures that a[b][c][d] exists. If it does not,
// it is created and set to {}. Either way, it is returned.
//
Meteor._ensure = function (obj /*, arguments */) {
    for (var i = 1; i < arguments.length; i++) {
        var key = arguments[i];
        if (!(key in obj))
            obj[key] = {};
        obj = obj[key];
    }

    return obj;
};

// _delete(a, b, c, d) deletes a[b][c][d], then a[b][c] unless it
// isn't empty, then a[b] unless it isn't empty.
//
Meteor._delete = function (obj /*, arguments */) {
    var stack = [obj];
    var leaf = true;
    for (var i = 1; i < arguments.length - 1; i++) {
        var key = arguments[i];
        if (!(key in obj)) {
            leaf = false;
            break;
        }
        obj = obj[key];
        if (typeof obj !== "object")
            break;
        stack.push(obj);
    }

    for (var i = stack.length - 1; i >= 0; i--) {
        var key = arguments[i + 1];

        if (leaf)
            leaf = false;
        else
            for (var other in stack[i][key])
                return; // not empty -- we're done

        delete stack[i][key];
    }
};


/**
 * @memberOf Meteor
 * @locus Anywhere
 * @summary Takes a function that has a callback argument as the last one and promissify it.
 * One option would be to use node utils.promisify, but it won't work on the browser.
 * @param {Function} fn
 * @param {Object} [context]
 * @param {Boolean} [errorFirst] - If the callback follows the errorFirst style, default to true
 * @returns {function(...[*]): Promise<unknown>}
 */
Meteor.promisify = function (fn, context, errorFirst) {
    if (errorFirst === undefined) {
        errorFirst = true;
    }

    return function () {
        return new Promise(function (resolve, reject) {
            var callback = Meteor.bindEnvironment(function (error, result) {
                var _error = error, _result = result;
                if (!errorFirst) {
                    _error = result;
                    _result = error;
                }

                if (_error) {
                    return reject(_error);
                }

                resolve(_result);
            });

            var filteredArgs = Array.prototype.slice.call(arguments)
                .filter(function (i) { return i !== undefined; });
            filteredArgs.push(callback);

            return fn.apply(context || this, filteredArgs);
        });
    };
};

// wrapAsync can wrap any function that takes some number of arguments that
// can't be undefined, followed by some optional arguments, where the callback
// is the last optional argument.
// e.g. fs.readFile(pathname, [callback]),
// fs.open(pathname, flags, [mode], [callback])
// For maximum effectiveness and least confusion, wrapAsync should be used on
// functions where the callback is the only argument of type Function.

/**
 * @memberOf Meteor
 * @summary Wrap a function that takes a callback function as its final parameter.
 * The signature of the callback of the wrapped function should be `function(error, result){}`.
 * On the server, the wrapped function can be used either synchronously (without passing a callback) or asynchronously
 * (when a callback is passed). On the client, a callback is always required; errors will be logged if there is no callback.
 * If a callback is provided, the environment captured when the original function was called will be restored in the callback.
 * The parameters of the wrapped function must not contain any optional parameters or be undefined, as the callback function is expected to be the final, non-undefined parameter.
 * @locus Anywhere
 * @param {Function} func A function that takes a callback as its final parameter
 * @param {Object} [context] Optional `this` object against which the original function will be invoked
 */
Meteor.wrapAsync = function (fn, context) {
    return function (/* arguments */) {
        var self = context || this;
        var newArgs = Array.prototype.slice.call(arguments);
        var callback;

        for (var i = newArgs.length - 1; i >= 0; --i) {
            var arg = newArgs[i];
            var type = typeof arg;
            if (type !== "undefined") {
                if (type === "function") {
                    callback = arg;
                }
                break;
            }
        }

        if (!callback) {
            callback = logErr;
            ++i; // Insert the callback just after arg.
        }

        newArgs[i] = Meteor.bindEnvironment(callback);
        return fn.apply(self, newArgs);
    };
};

Meteor.wrapFn = function (fn) {
    return fn;
};

// Sets child's prototype to a new object whose prototype is parent's
// prototype. Used as:
//   Meteor._inherits(ClassB, ClassA).
//   _.extend(ClassB.prototype, { ... })
// Inspired by CoffeeScript's `extend` and Google Closure's `goog.inherits`.
var hasOwn = Object.prototype.hasOwnProperty;
Meteor._inherits = function (Child, Parent) {
    // copy Parent static properties
    for (var key in Parent) {
        // make sure we only copy hasOwnProperty properties vs. prototype
        // properties
        if (hasOwn.call(Parent, key)) {
            Child[key] = Parent[key];
        }
    }

    // a middle member of prototype chain: takes the prototype from the Parent
    var Middle = function () {
        this.constructor = Child;
    };
    Middle.prototype = Parent.prototype;
    Child.prototype = new Middle();
    Child.__super__ = Parent.prototype;
    return Child;
};

var warnedAboutWrapAsync = false;

/**
 * @deprecated in 0.9.3
 */
Meteor._wrapAsync = function (fn, context) {
    if (!warnedAboutWrapAsync) {
        Meteor._debug("Meteor._wrapAsync has been renamed to Meteor.wrapAsync");
        warnedAboutWrapAsync = true;
    }
    return Meteor.wrapAsync.apply(Meteor, arguments);
};

function logErr(err) {
    if (err) {
        return Meteor._debug(
            "Exception in callback of async function",
            err
        );
    }
}
// ==== end copied from https://github.com/meteor/meteor/blob/master/packages/meteor/helpers.js


// ==== copied from https://github.com/meteor/meteor/blob/master/packages/meteor/errors.js

// Makes an error subclass which properly contains a stack trace in most
// environments. constructor can set fields on `this` (and should probably set
// `message`, which is what gets displayed at the top of a stack trace).
//
Meteor.makeErrorType = function (name, constructor) {
    var errorClass = function (/*arguments*/) {
        // Ensure we get a proper stack trace in most Javascript environments
        if (Error.captureStackTrace) {
            // V8 environments (Chrome and Node.js)
            Error.captureStackTrace(this, errorClass);
        } else {
            // Borrow the .stack property of a native Error object.
            this.stack = new Error().stack;
        }
        // Safari magically works.

        constructor.apply(this, arguments);

        this.errorType = name;
    };

    Meteor._inherits(errorClass, Error);

    return errorClass;
};

// This should probably be in the livedata package, but we don't want
// to require you to use the livedata package to get it. Eventually we
// should probably rename it to DDP.Error and put it back in the
// 'livedata' package (which we should rename to 'ddp' also.)
//
// Note: The DDP server assumes that Meteor.Error EJSON-serializes as an object
// containing 'error' and optionally 'reason' and 'details'.
// The DDP client manually puts these into Meteor.Error objects. (We don't use
// EJSON.addType here because the type is determined by location in the
// protocol, not text on the wire.)

/**
 * @summary This class represents a symbolic error thrown by a method.
 * @locus Anywhere
 * @class
 * @param {String} error A string code uniquely identifying this kind of error.
 * This string should be used by callers of the method to determine the
 * appropriate action to take, instead of attempting to parse the reason
 * or details fields.
 *
 * For legacy reasons, some built-in Meteor functions such as `check` throw
 * errors with a number in this field.
 *
 * @param {String} [reason] Optional.  A short human-readable summary of the
 * error, like 'Not Found'.
 * @param {String} [details] Optional.  Additional information about the error,
 * like a textual stack trace.
 */
Meteor.Error = Meteor.makeErrorType(
    "Meteor.Error",
    function (error, reason, details) {
        var self = this;

        // Newer versions of DDP use this property to signify that an error
        // can be sent back and reconstructed on the calling client.
        self.isClientSafe = true;

        // String code uniquely identifying this kind of error.
        self.error = error;

        // Optional: A short human-readable summary of the error. Not
        // intended to be shown to end users, just developers. ("Not Found",
        // "Internal Server Error")
        self.reason = reason;

        // Optional: Additional information about the error, say for
        // debugging. It might be a (textual) stack trace if the server is
        // willing to provide one. The corresponding thing in HTTP would be
        // the body of a 404 or 500 response. (The difference is that we
        // never expect this to be shown to end users, only developers, so
        // it doesn't need to be pretty.)
        self.details = details;

        // This is what gets displayed at the top of a stack trace. Current
        // format is "[404]" (if no reason is set) or "File not found [404]"
        if (self.reason)
            self.message = self.reason + ' [' + self.error + ']';
        else
            self.message = '[' + self.error + ']';
    });

// Meteor.Error is basically data and is sent over DDP, so you should be able to
// properly EJSON-clone it. This is especially important because if a
// Meteor.Error is thrown through a Future, the error, reason, and details
// properties become non-enumerable so a standard Object clone won't preserve
// them and they will be lost from DDP.
Meteor.Error.prototype.clone = function () {
    var self = this;
    return new Meteor.Error(self.error, self.reason, self.details);
};

// ==== end copied from https://github.com/meteor/meteor/blob/master/packages/meteor/errors.js

module.exports = {
    tinytestFilter: null,
    __meteor_runtime_config__: config,
    EJSON,
    globalThis: global,
    Meteor,
    Random,
}