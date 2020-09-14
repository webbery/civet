#include <node.h>
#include "civetkern.h"
#include "MessageType.h"
#include <iostream>

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

namespace caxios {
  static void AddOrUpdateFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {
    std::cout << "AddOrUpdateFiles" << std::endl;
  }
  static void GetClass(const v8::FunctionCallbackInfo<v8::Value>& info) {
    std::cout << "method" << std::endl;
  }
	//void Init(v8::Local<v8::Object> exports, v8::Local<v8::Object> module) {
	//	CAxios::Init(exports);
	//}

	//NODE_MODULE(NativeExtension, InitAll)
}

NODE_MODULE_INIT() {
  Isolate* isolate = context->GetIsolate();
  caxios::CAxios* data = new caxios::CAxios(isolate);

  Local<v8::External> external = v8::External::New(isolate, data);

  exports->Set(context,
    String::NewFromUtf8(isolate, "getClasss", v8::NewStringType::kNormal).ToLocalChecked(),
    v8::FunctionTemplate::New(isolate, &caxios::GetClass, external)
      ->GetFunction(context).ToLocalChecked()).FromJust();
  exports->Set(context,
    String::NewFromUtf8(isolate, "addOrUpdateFiles", v8::NewStringType::kNormal).ToLocalChecked(),
    v8::FunctionTemplate::New(isolate, &caxios::AddOrUpdateFiles, external)
      ->GetFunction(context).ToLocalChecked()).FromJust();
}
