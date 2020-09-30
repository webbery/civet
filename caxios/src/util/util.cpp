#include "util.h"
#include <nan.h>
#include <iostream>

namespace caxios {
  
  std::string ConvertToString(const v8::Local<v8::String>& value)
  {
    v8::Isolate* isolate = v8::Isolate::GetCurrent();
    const int length = value->Utf8Length(isolate)+1;
    char* charFileName = new char[length];
    memset(charFileName, length, 0x00);
    (*value)->WriteUtf8(isolate, charFileName);
    std::string str;
    str.assign(charFileName);
    return std::move(str);
  }

  std::string ConvertToString(const v8::Local<v8::Value>& value)
  {
    return ConvertToString(value->ToString(v8::Isolate::GetCurrent()));
  }

  int32_t ConvertToInt32(const v8::Local<v8::Value>& value)
  {
    int32_t cnt = 0;
    if (value->IsInt32()) {
#if V8_MAJOR_VERSION == 7
      cnt = value->ToInt32(v8::Isolate::GetCurrent())->Value();
#elif V8_MAJOR_VERSION == 8
      value->Int32Value(Nan::GetCurrentContext()).To(&cnt);
#endif
    }
    return cnt;
  }

  uint32_t ConvertToUInt32(const v8::Local<v8::Value>& value)
  {
    uint32_t cnt = 0;
    if (value->IsUint32()) {
//#if V8_MAJOR_VERSION == 7
//      cnt = value->ToUint32(Nan::GetCurrentContext())->Value();
//#elif V8_MAJOR_VERSION == 8
      value->Uint32Value(Nan::GetCurrentContext()).To(&cnt);
//#endif
    }
    return cnt;
  }

  v8::Local<v8::Value> GetValueFromValue(const v8::Local<v8::Value>& value, const std::string& key)
  {
    if (!key.empty()) {
      size_t pos = key.find_first_of(".");
      auto k = key.substr(0, pos);
      v8::Local<v8::Object> obj = v8::Local<v8::Object>::Cast(value);
      return GetValueFromObject(obj, k);
    }
    return value;
  }

  v8::Local<v8::Value> GetValueFromObject(const v8::Local<v8::Object>& obj, const std::string& key)
  {
    v8::Local<v8::Value> ret = obj.As<v8::Value>();
    if (!obj->IsObject()) return ret;
    if (!key.empty()) {
      size_t pos = key.find_first_of(".");
      auto k = key.substr(0, pos);
      v8::Local<v8::Array> props = obj->GetOwnPropertyNames(Nan::GetCurrentContext()).ToLocalChecked();
      for (int i = 0, l = props->Length(); i < l; i++) {
        v8::Local<v8::Value> localKey = props->Get(i);
        std::string propName = ConvertToString(localKey->ToString(v8::Isolate::GetCurrent()));
        if (propName == k) {
          ret = obj->Get(Nan::GetCurrentContext(), localKey).ToLocalChecked();
          return GetValueFromValue(ret, key.substr(pos + 1));
        }
      }
    }
    return ret;
  }

  void ForeachObject(const v8::Local<v8::Value>& obj, std::function<void(const v8::Local<v8::Value>&, const v8::Local<v8::Value>&)> func)
  {
    auto item = v8::Local<v8::Object>::Cast(obj);
    v8::Local<v8::Array> props = item->GetOwnPropertyNames(Nan::GetCurrentContext()).ToLocalChecked();
    for (int i = 0, l = props->Length(); i < l; i++) {
      v8::Local<v8::Value> key = props->Get(i);
      std::string propName = ConvertToString(key->ToString(v8::Isolate::GetCurrent()));
      v8::Local<v8::Value> value = item->Get(Nan::GetCurrentContext(), key).ToLocalChecked();
      func(key, value);
    }
  }

  void ForeachArray(const v8::Local<v8::Value>& arr, std::function<void(const v8::Local<v8::Value>&)> func)
  {
    if (arr->IsArray()) {
      v8::Local<v8::Array> lArr = arr.As<v8::Array>();
      for (int i = 0, l = lArr->Length(); i < l; i++)
      {
        v8::Local<v8::Value> localItem = lArr->Get(i);
        func(localItem);
      }
    }
  }

  v8::Local<v8::String> StringToValue(const std::string& str)
  {
    v8::Isolate* isolate = v8::Isolate::GetCurrent();
    return v8::String::NewFromUtf8(isolate, str.c_str(), v8::String::kNormalString);
  }

}