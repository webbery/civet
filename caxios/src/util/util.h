#ifndef _CAXIOS_UTIL_H_
#define _CAXIOS_UTIL_H_
#include <string>
#include <node.h>
#include <functional>
#include <nan.h>
#include "datum_type.h"

namespace caxios {
  std::string ConvertToString(const v8::Local<v8::String>& value);
  std::string ConvertToString(const v8::Local<v8::Value>& value);
  int32_t ConvertToInt32(const v8::Local<v8::Value>& value);
  uint32_t ConvertToUInt32(const v8::Local<v8::Value>& value);

  template<typename T> struct v8_traits;
  template<> struct v8_traits< FileID > {
    typedef v8::Uint32 type;
    static FileID from(const v8::Local<v8::Value>& t) {
      return ConvertToUInt32(t);
    }
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
  template<> struct v8_traits<FileInfo> {
    typedef v8::Object type;
  };
  template<> struct v8_traits<MetaItem> {
    typedef v8::Object type;
  };

  template<typename T>
  void SetArrayValue(v8::Local<v8::Array>& arr, int idx, const T& val) {
    Nan::Set(arr, idx, Nan::New<v8_traits<T>::type>(val));
  }

  void SetArrayValue(v8::Local<v8::Array>& arr, int idx, const Snap& val);
  void SetArrayValue(v8::Local<v8::Array>& arr, int idx, const FileInfo& val);
  void SetArrayValue(v8::Local<v8::Array>& arr, int idx, const MetaItem& val);

  template<typename T>
  v8::Local<v8::Array> ConvertFromArray(const std::vector<T>& arr) {
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

  template<typename K, typename V>
  v8::Local<v8::Object> ConvertFromMap(const std::map<K, V>& kv) {
    if (kv.size() == 0) return v8::Local<v8::Object>();
    auto obj = Nan::New<v8::Object>();
    for_each(kv.begin(), kv.end(),
      [&](std::pair<K, V> pr) {
#if V8_MAJOR_VERSION == 7
        obj->Set(Nan::New<v8_traits<K>::type>(pr.first).ToLocalChecked(), Nan::New<v8_traits<K>::type>(pr.second).ToLocalChecked());
#elif V8_MAJOR_VERSION == 8
        obj->Set(v8::Isolate::GetCurrent()->GetCurrentContext(), 
          Nan::New<v8_traits<K>::type>(pr.first).ToLocalChecked(), Nan::New<v8_traits<K>::type>(pr.second).ToLocalChecked());
#endif
      });
    return obj;
  }

  template<typename T>
  std::vector<T> ConvertToArray(const v8::Local<v8::Value>& arr) {
    std::vector<T> res;
    v8::Local<v8::Array> lArr = arr.As<v8::Array>();
    for (int i = 0, l = lArr->Length(); i < l; i++)
    {
      v8::Local<v8::Value> localItem = lArr->Get(v8::Isolate::GetCurrent()->GetCurrentContext(), i).ToLocalChecked();
      T val = v8_traits<T>::from(localItem);
      res.emplace_back(val);
    }
    return std::move(res);
  }

  v8::Local<v8::Value> GetValueFromValue(const v8::Local<v8::Value>& value, const std::string& key);
  v8::Local<v8::Value> GetValueFromObject(const v8::Local<v8::Object>& obj, const std::string& key);
  void ForeachObject(const v8::Local<v8::Value>& value, std::function<void(const v8::Local<v8::Value>&, const v8::Local<v8::Value>&)> func);
  void ForeachArray(const v8::Local<v8::Value>& arr, std::function<void(const v8::Local<v8::Value>&)> func);

  v8::Local<v8::String> StringToValue(const std::string& str);
  std::string Stringify(v8::Local<v8::Value> obj);

  std::string trunc(const std::string& elm);
}

#endif
