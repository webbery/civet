#pragma once
#include <string>

namespace caxios {
  enum ValueType {
    VTUnkwon,
    VTString,
    VTInteger,
    VTDecimal,
    VTDate,
    VTColor,
    VTHash,
  };

  class IValue {
  public:
    IValue(ValueType tp);
    virtual ~IValue() {}
    virtual ValueType Type() { return _type; }

  protected:
    ValueType _type;
  };

  //template<typename T> struct value_traits;
  //template<> struct value_traits<std::string> {
  //  static std::string get(IValue* val) {
  //    String* s = (String*)val;
  //    return s->Get();
  //  }
  //};
  //template<> struct value_traits<int64_t> {
  //  static int64_t get(IValue* val) {
  //    Integer* s = (Integer*)val;
  //    return s->Get();
  //  }
  //};

  //template<typename T>
  //T As(IValue* p) {
  //  return value_traits<T>::get(p);
  //}
}