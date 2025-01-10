// (start of meteor/extern-preamble.js)
// provide stubs or proxies for nodejs APIs referenced by emscripten.
const proc = require('process');
const perfHooks = require('perf_hooks');
const nodever = proc.versions.node;
const noderelease = { ...(proc.release) }
// Put emscripten in "node mode" but don't give it the real `process`
// object.  It does have access to `console`.
// This is to avoid emscripten causing memory leaks.

require = function (mod) {
  // mock 'fs' module
  if (mod === 'fs') {
    return {
      readFileSync: function (filename) {
        ; // no-op
      }
    };
  } else if (mod === 'perf_hooks') {
    return perfHooks;
  }
};
const process = {
  argv: ['node', 'minisat'],
  on: function () { },
  stdout: {
    write: function (str) {
      console.log("MINISAT-out:", str.replace(/\n$/, ''));
    }
  },
  stderr: {
    write: function (str) {
      console.log("MINISAT-err:", str.replace(/\n$/, ''));
    }
  },
  versions: {
    node: nodever
  },
  release: noderelease,
  exit: proc.exit
};
var window = 0;
// (end of meteor/extern-preamble.js)
