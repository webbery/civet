#include "util.h"
#include <iostream>
#include "log.h"
#if defined(__APPLE__) || defined(__gnu_linux__) || defined(__linux__) 
#include <sys/types.h>
#include <sys/stat.h>
#elif defined(WIN32)
#include <direct.h>
#include <io.h>
#endif

namespace caxios {
  
  bool exist(const std::string& filepath) {
#if defined(__APPLE__) || defined(UNIX) || defined(LINUX)
    if (access(filepath.c_str(), 0) == 0) return true;
#elif defined(WIN32)
    if (_access(filepath.c_str(), 0) == 0) return true;
#endif
    return false;
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

  std::string AttrAsStr(Napi::Object obj, int attrs)
  {
    //T_LOG("display: %s", attrs.c_str());
    return obj.Get(attrs).As<Napi::String>();
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

  std::vector<std::string> AttrAsStringVector(Napi::Object obj, std::string attr)
  {
    Napi::Array array = obj.Get(attr).As<Napi::Array>();
    std::vector<std::string> vector(array.Length());
    for (unsigned int i = 0; i < array.Length(); i++) {
      vector[i] = AttrAsStr(array, i);
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

  std::vector<uint32_t> ArrayAsUint32Vector(Napi::Array arr)
  {
    std::vector< uint32_t > vec;
    ForeachArray(arr, [&vec](Napi::Value item) {
      uint32_t fid = item.As<Napi::Number>().Uint32Value();
      vec.emplace_back(fid);
    });
    return std::move(vec);
  }

  std::vector<std::string> ArrayAsStringVector(Napi::Array arr)
  {
    std::vector< std::string > vec;
    ForeachArray(arr, [&vec](Napi::Value item) {
      std::string fid = item.As<Napi::String>();
      vec.emplace_back(fid);
    });
    return std::move(vec);
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

  std::string Stringify(Napi::Env env, Napi::Object obj)
  {
    Napi::Object json = env.Global().Get("JSON").As<Napi::Object>();
    Napi::Function stringify = json.Get("stringify").As<Napi::Function>();
    return stringify.Call(json, { obj }).As<Napi::String>();
  }

  Napi::Object Parse(Napi::Env env, const std::string& str) {
    Napi::Object json = env.Global().Get("JSON").As<Napi::Object>();
    Napi::Function parse = json.Get("parse").As<Napi::Function>();
    Napi::String jstr = Napi::String::New(env, str.c_str());
    return parse.Call(json, { jstr }).As<Napi::Object>();
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

  void Call(Napi::Env env, const std::string& func, const std::vector<std::string>& params)
  {
    auto global = env.Global();
    auto function = global.Get(func);
    std::vector<napi_value> vArgs;
    for (const std::string& arg : params) {
      Napi::String v = Napi::String::New(env, arg.c_str());
      vArgs.emplace_back(v);
    }
    auto result = function.As<Napi::Function>().Call(vArgs);
  }
}