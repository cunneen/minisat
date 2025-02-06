// (start of meteor/extern-preamble.js)
// 
// provide stubs or proxies for nodejs APIs referenced by emscripten.
// Put emscripten in "node mode" but don't give it the real `process`
// object.  
// This is to avoid emscripten causing memory leaks.
// It *does* have access to `console`.
require = function (mod) {
  // mock 'fs' module
  if (mod === 'fs') {
    return {
      readFileSync: function (filename) {
        throw new Error(`github.com/meteor/minisat: meteor > extern-preamble.js > require > readFileSync not implemented`);
        ; // no-op
      }
    };
  } else if (mod === 'perf_hooks') {
    return {
      now: () => Date.now()
    };
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
    "node": "14.21.3"
  },
  release: {
    "name": "node",
  },
  exit: (code) => { console?.error(`github.com/meteor/minisat meteor > extern-preamble.js > process > exit not implemented.`); }
};
const window = 0;
// (end of meteor/extern-preamble.js)