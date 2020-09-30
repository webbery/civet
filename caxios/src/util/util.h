#ifndef _CAXIOS_UTIL_H_
#define _CAXIOS_UTIL_H_
#include <string>
#include <node.h>
#include <functional>

namespace caxios {
  std::string ConvertToString(const v8::Local<v8::String>& value);
  std::string ConvertToString(const v8::Local<v8::Value>& value);
  int32_t ConvertToInt32(const v8::Local<v8::Value>& value);
  uint32_t ConvertToUInt32(const v8::Local<v8::Value>& value);

  v8::Local<v8::Value> GetValueFromValue(const v8::Local<v8::Value>& value, const std::string& key);
  v8::Local<v8::Value> GetValueFromObject(const v8::Local<v8::Object>& obj, const std::string& key);
  void ForeachObject(const v8::Local<v8::Value>& value, std::function<void(const v8::Local<v8::Value>&, const v8::Local<v8::Value>&)> func);
  void ForeachArray(const v8::Local<v8::Value>& arr, std::function<void(const v8::Local<v8::Value>&)> func);

  v8::Local<v8::String> StringToValue(const std::string& str);
}

#endif
