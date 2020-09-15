#ifndef _CAXIOS_UTIL_H_
#define _CAXIOS_UTIL_H_
#include <string>
#include <node.h>

namespace caxios {
  std::string ConvertToString(v8::Isolate* isolate, const v8::Local<v8::String>& value);
}

#endif
