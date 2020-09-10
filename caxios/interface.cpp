/********************************************************************
消息通过如下几种方式触发, 通知到js
1. invoke_from_c(type, json): 通过全局的invoke_from_c函数，将参数返回给js
/********************************************************************/
#include <emscripten/bind.h>
#include <emscripten.h>
#include "caxios.h"
#include "MessageType.h"

using namespace emscripten;

int say_hello() {
  printf("Hello from your wasm module\n");
  EM_ASM({
      if(invoke_from_c !== undefined) invoke_from_c($0, $1);
  }, MSG_TEST, MSG_TEST);
  return 0;
}

EMSCRIPTEN_BINDINGS(caxios) {
  function("sayHello", &say_hello);
  class_<caxios::CAxios>("caxios")
    .constructor<>()
    .function("addOrUpdateClass", &caxios::CAxios::AddOrUpdateClass)
    .function("release", &caxios::CAxios::Release);
}