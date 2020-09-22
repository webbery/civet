#ifndef _CAXIOS_UTIL_H_
#define _CAXIOS_UTIL_H_
#include <string>
#include <node.h>

namespace caxios {
  std::string ConvertToString(const v8::Local<v8::String>& value);
  int32_t ConvertToInt32(const v8::Local<v8::Value>& value);

  v8::Local<v8::Value> GetValueFromValue(const v8::Local<v8::Value>& value, const std::string& key);

  v8::Local<v8::Value> GetValueFromObject(const v8::Local<v8::Object>& obj, const std::string& key);

  v8::Local<v8::String> StringToValue(const std::string& str);
}

#endif
