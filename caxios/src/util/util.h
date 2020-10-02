#ifndef _CAXIOS_UTIL_H_
#define _CAXIOS_UTIL_H_
#include <string>
#include <node.h>
#include <functional>
#include "datum_type.h"

namespace caxios {
  template<typename T> struct v8_traits;
  template<> struct v8_traits< FileID > {
    typedef v8::Uint32 type;
  };
  template<> struct v8_traits< Snap > {
    typedef v8::Object type;
  };
  template<> struct v8_traits< std::string > {
    typedef v8::String type;
  };
  template<> struct v8_traits< char > {
    typedef v8::Int32 type;
  };

  std::string ConvertToString(const v8::Local<v8::String>& value);
  std::string ConvertToString(const v8::Local<v8::Value>& value);
  int32_t ConvertToInt32(const v8::Local<v8::Value>& value);
  uint32_t ConvertToUInt32(const v8::Local<v8::Value>& value);

  template<typename T>
  void SetArrayValue(v8::Local<v8::Array>& arr, int idx, const T& val) {
    Nan::Set(arr, idx, Nan::New<v8_traits<T>::type>(val));
  }

  void SetArrayValue(v8::Local<v8::Array>& arr, int idx, const Snap& val);

  template<typename T>
  v8::Local<v8::Array> ConvertFromArray(std::vector<T>& arr) {
    if (arr.size() == 0) return v8::Local<v8::Array>();
    v8::Local<v8::Array> results = Nan::New<v8::Array>(arr.size());
    int i = 0;
    for_each(arr.begin(), arr.end(),
      [&](T value) {
        SetArrayValue(results, i, value);
        i++;
      });
    return results;
  }

  v8::Local<v8::Value> GetValueFromValue(const v8::Local<v8::Value>& value, const std::string& key);
  v8::Local<v8::Value> GetValueFromObject(const v8::Local<v8::Object>& obj, const std::string& key);
  void ForeachObject(const v8::Local<v8::Value>& value, std::function<void(const v8::Local<v8::Value>&, const v8::Local<v8::Value>&)> func);
  void ForeachArray(const v8::Local<v8::Value>& arr, std::function<void(const v8::Local<v8::Value>&)> func);

  v8::Local<v8::String> StringToValue(const std::string& str);
}

#endif
