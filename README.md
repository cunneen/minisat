### Building MiniSat with Emscripten for the Meteor logic-solver

1. Install Emscripten v3.1.74. On a Mac with Brew:

    ```sh
    wget https://raw.githubusercontent.com/Homebrew/homebrew-core/d6f9b7309b9a2fed49a0083bb13de362bb3db965/Formula/e/emscripten.rb && \
    brew install emscripten.rb
    ```
  
   (Last tested with emscripten 3.1.74. **NOTE** emscripten v4 seems to have a
   breaking change.)
2. Check that you have `emmake`, `emcc`, and `node` in your path.  If you don't
   have `node` in your path, you can locally modify the script in the next step
   where it says `NODE=node`.  (Node is only used to run a quick sanity check
   after compiling.)
3. In the repo directory, run `meteor/make-emscripten.sh`.
4. That's it.  If everything worked, the build product is `build/minisat.js`.

Notes:

* The "native" part of logic-solver is in `meteor/logic-solver.cc`.  If you add
  functions to it, you need to also list them in `make-emscripten.sh`.

* We wrap the entire Emscripten output in a closure, so that we can create
  multiple instances of the entire C environment (including the heap).
  MiniSat's C++ classes are slightly leaky, and it doesn't seem wise to have
  multiple solver instances sharing a heap on the "native" side.  Better to
  fully isolate instances, and not rely on (or even call) the destructor.

* There's heap allocation instrumentation, hackily implemented, that doesn't
  actually run unless you put the compiler in debug mode (see comment in the
  make script about the -g flag). You can enable the instrumentation
  by passing ENABLE_INSTRUMENTATION=true as an environment variable, e.g.:

  ```sh
  ENABLE_INSTRUMENTATION=true ./meteor/make-emscripten.sh
  ```

* You want to leave minification on (no -g flag or ENABLE_INSTRUMENTATION env var),
  because unlike client-side code served by Meteor (which is minified anyway),
  Node runs this code directly.  Minification actually helps the JS compile time
  quite a bit!
