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

  bool HasAttr(Napi::Object obj, std::string attr)
  {
    return obj.Has(attr);
  }

  std::string AttrAsStr(Napi::Object obj, std::string attrs)
  {
    //T_LOG("display: %s", attrs.c_str());
    if (attrs[0] != '/') {
      return obj.Get(attrs).As<Napi::String>();
    }
    size_t offset = attrs.find_first_of('/', 1);
    if(offset!= std::string::npos){
      std::string attr = attrs.substr(1, offset - 1);
      size_t count = attrs.size() - attr.size();
      std::string child = attrs.substr(offset, count);
      //T_LOG("display: %s, %s", attr.c_str(), child.c_str());
      obj = obj.Get(attr).As<Napi::Object>();
      return AttrAsStr(obj, child);
    }
    return AttrAsStr(obj, attrs.substr(1, attrs.size() - 1));
  }

  uint32_t AttrAsUint32(Napi::Object obj, std::string attr)
  {
    return obj.Get(attr).As<Napi::Number>().Uint32Value();
  }

  uint32_t AttrAsUint32(Napi::Object obj, unsigned int const attr)
  {
    return obj.Get(attr).As<Napi::Number>().Uint32Value();
  }

  int32_t AttrAsInt32(Napi::Object obj, std::string attr)
  {
    return obj.Get(attr).As<Napi::Number>().Int32Value();
  }

  int32_t AttrAsInt32(Napi::Object obj, unsigned int const attr)
  {
    return obj.Get(attr).As<Napi::Number>().Int32Value();
  }

  double AttrAsDouble(Napi::Object obj, std::string attr)
  {
    return obj.Get(attr).As<Napi::Number>().DoubleValue();
  }

  double AttrAsDouble(Napi::Object obj, unsigned int const attr)
  {
    return obj.Get(attr).As<Napi::Number>().DoubleValue();
  }

  bool AttrAsBool(Napi::Object obj, std::string attr)
  {
    return obj.Get(attr).As<Napi::Boolean>().Value();
  }

  Napi::Array AttrAsArray(Napi::Object obj, std::string attr)
  {
    return obj.Get(attr).As<Napi::Array>();
  }

  std::vector<int32_t> AttrAsInt32Vector(Napi::Object obj, std::string attr)
  {
    Napi::Array array = obj.Get(attr).As<Napi::Array>();
    std::vector<int32_t> vector(array.Length());
    for (unsigned int i = 0; i < array.Length(); i++) {
      vector[i] = AttrAsInt32(array, i);
    }
    return vector;
  }

  std::vector<uint32_t> AttrAsUint32Vector(Napi::Object obj, std::string attr)
  {
    Napi::Array array = obj.Get(attr).As<Napi::Array>();
    std::vector<uint32_t> vector(array.Length());
    for (unsigned int i = 0; i < array.Length(); i++) {
      vector[i] = AttrAsUint32(array, i);
    }
    return vector;
  }

  Napi::Object FindObjectFromArray(Napi::Object obj, std::function<bool(Napi::Object)> func)
  {
    Napi::Array array = obj.As<Napi::Array>();
    for (unsigned int i = 0; i < array.Length(); i++) {
      auto item = array.Get(i).As<Napi::Object>();
      if (func(item)) {
        return item;
      }
    }
    return Napi::Object();
  }

  void ForeachObject(Napi::Value value, std::function<void(const std::string&, Napi::Value)> func)
  {
    auto item = value.As<Napi::Object>();
    auto props = item.GetPropertyNames();
    for (int i = 0, l = props.Length(); i < l; i++) {
      std::string key = props.Get(i).As<Napi::String>();
      func(key, item);
    }
  }

  void ForeachArray(Napi::Value arr, std::function<void(Napi::Value)> func)
  {
    Napi::Array lArr = arr.As<Napi::Array>();
    for (int i = 0, l = lArr.Length(); i < l; i++)
    {
      Napi::Value localItem = lArr.Get(i);
      func(localItem);
    }
  }

  std::string Stringify(v8::Local<v8::Value> item)
  {
    auto isolate = v8::Isolate::GetCurrent();
    auto context = isolate->GetCurrentContext();
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
    if (elm[0] == '"' && elm[elm.size() - 1] == '"') {
      start += 1;
      end -= 1;
    }
    else if (elm[0] == '\'' && elm[elm.size() - 1] == '\'') {
      start += 1;
      end -= 1;
    }
    return elm.substr(start, end - start);
  }

}