#include <emscripten/bind.h>

using namespace emscripten;

int say_hello() {
  printf("Hello from your wasm module\n");
  return 0;
}

EMSCRIPTEN_BINDINGS(caxios) {
  function("sayHello", &say_hello);
}