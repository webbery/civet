#include "util.h"
#include <iostream>
#include "log.h"

namespace caxios {
  
  std::string ConvertToString(const v8::Local<v8::String>& value)
  {
    v8::Isolate* isolate = v8::Isolate::GetCurrent();
#if V8_MAJOR_VERSION <= 5
    const int length = value->Utf8Length() + 1;
#else
    const int length = value->Utf8Length(isolate)+1;
#endif
    char* charFileName = new char[length];
    memset(charFileName, length, 0x00);
#if V8_MAJOR_VERSION <= 5
    (*value)->WriteUtf8(charFileName);
#else
    (*value)->WriteUtf8(isolate, charFileName);
#endif
    std::string str;
    str.assign(charFileName);
    return std::move(str);
  }

  std::string ConvertToString(const v8::Local<v8::Value>& value)
  {
#if V8_MAJOR_VERSION <= 7
    return ConvertToString(value->ToString(v8::Isolate::GetCurrent()));
#elif V8_MAJOR_VERSION == 8
    return ConvertToString(value->ToString(v8::Isolate::GetCurrent()->GetCurrentContext()).ToLocalChecked());
#endif
  }

  int32_t ConvertToInt32(const v8::Local<v8::Value>& value)
  {
    int32_t cnt = 0;
    if (value->IsInt32()) {
#if V8_MAJOR_VERSION <= 7
      cnt = value->ToInt32(v8::Isolate::GetCurrent())->Value();
#elif V8_MAJOR_VERSION == 8
      value->Int32Value(v8::Isolate::GetCurrent()->GetCurrentContext()).To(&cnt);
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
      value->Uint32Value(v8::Isolate::GetCurrent()->GetCurrentContext()).To(&cnt);
//#endif
    }
    return cnt;
  }

  void SetArrayValue(v8::Local<v8::Array>& arr, int idx, const Snap& val)
  {
    auto obj = Nan::New<v8_traits<Snap>::type>();
#if V8_MAJOR_VERSION == 7
    obj->Set(Nan::New("fileid").ToLocalChecked(), Nan::New<v8_traits<FileID>::type>(std::get<0>(val)));
    obj->Set(Nan::New("value").ToLocalChecked(), Nan::New(std::get<1>(val).c_str()).ToLocalChecked());
    obj->Set(Nan::New("step").ToLocalChecked(), Nan::New<v8_traits<char>::type>(std::get<2>(val)));
#elif V8_MAJOR_VERSION == 8
    obj->Set(v8::Isolate::GetCurrent()->GetCurrentContext(), Nan::New("fileid").ToLocalChecked(), Nan::New<v8_traits<FileID>::type>(std::get<0>(val)));
    obj->Set(v8::Isolate::GetCurrent()->GetCurrentContext(), Nan::New("value").ToLocalChecked(), Nan::New(std::get<1>(val).c_str()).ToLocalChecked());
    obj->Set(v8::Isolate::GetCurrent()->GetCurrentContext(), Nan::New("step").ToLocalChecked(), Nan::New<v8_traits<char>::type>(std::get<2>(val)));
#endif
    T_LOG("fileid: %d, value %s, step %d", std::get<0>(val), std::get<1>(val).c_str(), std::get<2>(val));
#if V8_MAJOR_VERSION == 7
    arr->Set(idx, obj);
#elif V8_MAJOR_VERSION == 8
    arr->Set(v8::Isolate::GetCurrent()->GetCurrentContext(), idx, obj);
#endif
  }

  void SetArrayValue(v8::Local<v8::Array>& arr, int idx, const FileInfo& val)
  {
    auto obj = Nan::New<v8_traits<FileInfo>::type>();
    const std::vector<MetaItem>& items = std::get<1>(val);
    auto meta = ConvertFromArray(items);
#if V8_MAJOR_VERSION == 7
    obj->Set(Nan::New("fileid").ToLocalChecked(), Nan::New<v8_traits<FileID>::type>(std::get<0>(val)));
    obj->Set(Nan::New("meta").ToLocalChecked(), meta);
#elif V8_MAJOR_VERSION == 8
    obj->Set(v8::Isolate::GetCurrent()->GetCurrentContext(), Nan::New("fileid").ToLocalChecked(), Nan::New<v8_traits<FileID>::type>(std::get<0>(val)));
    obj->Set(v8::Isolate::GetCurrent()->GetCurrentContext(), Nan::New("meta").ToLocalChecked(), meta);
#endif

    T_LOG("SetArrayValue FileInfo(fileid: %d)", std::get<0>(val));
#if V8_MAJOR_VERSION == 7
    arr->Set(idx, obj);
#elif V8_MAJOR_VERSION == 8
    arr->Set(v8::Isolate::GetCurrent()->GetCurrentContext(), idx, obj);
#endif
  }

  void SetArrayValue(v8::Local<v8::Array>& arr, int idx, const MetaItem& val)
  {
    auto jsn = ConvertFromMap(val);
    //T_LOG("MetaItem fileid: %d, value %s, step %d", std::get<0>(val), std::get<1>(val).c_str(), std::get<2>(val));
#if V8_MAJOR_VERSION == 7
    arr->Set(idx, jsn);
#elif V8_MAJOR_VERSION == 8
    arr->Set(v8::Isolate::GetCurrent()->GetCurrentContext(), idx, jsn);
#endif
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
      v8::Local<v8::Array> props = obj->GetOwnPropertyNames(v8::Isolate::GetCurrent()->GetCurrentContext()).ToLocalChecked();
      for (int i = 0, l = props->Length(); i < l; i++) {
        v8::Local<v8::Value> localKey = props->Get(v8::Isolate::GetCurrent()->GetCurrentContext(), i).ToLocalChecked();
#if V8_MAJOR_VERSION == 7
        std::string propName = ConvertToString(localKey->ToString(v8::Isolate::GetCurrent()));
#elif V8_MAJOR_VERSION == 8
        std::string propName = ConvertToString(localKey->ToString(v8::Isolate::GetCurrent()->GetCurrentContext()).ToLocalChecked());
#endif
        if (propName == k) {
          ret = obj->Get(v8::Isolate::GetCurrent()->GetCurrentContext(), localKey).ToLocalChecked();
          return GetValueFromValue(ret, key.substr(pos + 1));
        }
      }
    }
    T_LOG("key %s not exist", key.c_str());
    return ret;
  }

  void ForeachObject(const v8::Local<v8::Value>& obj, std::function<void(const v8::Local<v8::Value>&, const v8::Local<v8::Value>&)> func)
  {
    auto item = v8::Local<v8::Object>::Cast(obj);
    v8::Local<v8::Array> props = item->GetOwnPropertyNames(v8::Isolate::GetCurrent()->GetCurrentContext()).ToLocalChecked();
    for (int i = 0, l = props->Length(); i < l; i++) {
      v8::Local<v8::Value> key = props->Get(v8::Isolate::GetCurrent()->GetCurrentContext(), i).ToLocalChecked();
#if V8_MAJOR_VERSION == 7
      std::string propName = ConvertToString(key->ToString(v8::Isolate::GetCurrent()));
#elif V8_MAJOR_VERSION == 8
      std::string propName = ConvertToString(key->ToString(v8::Isolate::GetCurrent()->GetCurrentContext()).ToLocalChecked());
#endif
      v8::Local<v8::Value> value = item->Get(v8::Isolate::GetCurrent()->GetCurrentContext(), key).ToLocalChecked();
      func(key, value);
    }
  }

  void ForeachArray(const v8::Local<v8::Value>& arr, std::function<void(const v8::Local<v8::Value>&)> func)
  {
    if (arr->IsArray()) {
      v8::Local<v8::Array> lArr = arr.As<v8::Array>();
      for (int i = 0, l = lArr->Length(); i < l; i++)
      {
        v8::Local<v8::Value> localItem = lArr->Get(v8::Isolate::GetCurrent()->GetCurrentContext(), i).ToLocalChecked();
        func(localItem);
      }
    }
  }

  v8::Local<v8::String> StringToValue(const std::string& str)
  {
    v8::Isolate* isolate = v8::Isolate::GetCurrent();
#if V8_MAJOR_VERSION == 7
    return v8::String::NewFromUtf8(isolate, str.c_str(), v8::String::kNormalString);
#elif V8_MAJOR_VERSION == 8
    return v8::String::NewFromUtf8(isolate, str.c_str()).ToLocalChecked();
#endif
  }

  std::string Stringify(v8::Local<v8::Value> item)
  {
    auto context = Nan::GetCurrentContext();
    auto isolate = v8::Isolate::GetCurrent();
    auto JSON = context->Global()->Get(context,
      v8::String::NewFromUtf8(isolate, "JSON", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked().As<v8::Object>();
    auto stringify = JSON->Get(context,
      v8::String::NewFromUtf8(isolate, "stringify", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked().As<v8::Function>();
    auto v = stringify->Call(context, Undefined(isolate), 1, &item).ToLocalChecked();
    v8::String::Utf8Value json_value(isolate, v);
    std::string sItem(*json_value, json_value.length());
    return std::move(sItem);
  }

  std::string trunc(const std::string& elm)
  {
    size_t start = 0;
    size_t end = elm.size();
    if (elm[0] == '"') {
      start += 1;
    }
    if (elm[elm.size() - 1] == '"') {
      end -= 1;
    }
    return elm.substr(start, end - start);
  }

}