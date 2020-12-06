#ifndef _CAXIOS_UTIL_H_
#define _CAXIOS_UTIL_H_
#include <string>
#include <node.h>
#include <napi.h>
#include <functional>
#include "datum_type.h"

namespace caxios {
  bool HasAttr(Napi::Object obj, std::string attr);
  std::string AttrAsStr(Napi::Object obj, const std::string& attr);
  uint32_t AttrAsUint32(Napi::Object obj, std::string attr);
  uint32_t AttrAsUint32(Napi::Object obj, unsigned int const attr);
  int32_t AttrAsInt32(Napi::Object obj, std::string attr);
  int32_t AttrAsInt32(Napi::Object obj, unsigned int const attr);
  double AttrAsDouble(Napi::Object obj, std::string attr);
  double AttrAsDouble(Napi::Object obj, unsigned int const attr);
  bool AttrAsBool(Napi::Object obj, std::string attr);
  Napi::Array AttrAsArray(Napi::Object obj, std::string attr);
  std::vector<int32_t> AttrAsInt32Vector(Napi::Object obj, std::string attr);
  std::vector<uint32_t> AttrAsUint32Vector(Napi::Object obj, std::string attr);
  std::vector<std::string> AttrAsStringVector(Napi::Object obj, std::string attr);
  Napi::Object FindObjectFromArray(Napi::Object obj, std::function<bool(Napi::Object)> func);
  std::vector<uint32_t> ArrayAsUint32Vector(Napi::Array arr);
  std::vector<std::string> ArrayAsStringVector(Napi::Array arr);
  Napi::Array Vector2Array(Napi::Env env, const std::vector<std::string>& vStr);

  void ForeachObject(Napi::Value value, std::function<void(const std::string&, Napi::Value)> func);
  void ForeachArray(Napi::Value arr, std::function<void(Napi::Value)> func);

  std::string Stringify(Napi::Env env, Napi::Object obj);
  Napi::Object Parse(Napi::Env env, const std::string& str);
  void Call(Napi::Env env, const std::string& str, const std::vector<std::string>& params);

  std::string trunc(const std::string& elm);
  std::vector<std::string> split(const std::string& str, char delim);

  bool exist(const std::string& filepath);
  std::string serialize(const std::vector< std::vector<WordIndex> >& classes);
  std::string serialize(const std::vector<WordIndex>& classes);

  void deserialize(const std::string&, std::vector<WordIndex>&);
  void deserialize(const std::string&, std::vector< std::vector<WordIndex> >&);
  template<typename Ret>
  Ret deserialize(const std::string& str) {
    Ret ret;
    deserialize(str, ret);
    return std::move(ret);
  }
  // use hash to encode string
  int32_t encode(const std::string& str);
}

#endif
