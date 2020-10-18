#pragma once
#include "Value.h"

namespace caxios {
  class String : public IValue {
  public:
    String(const char* str);
    std::string Get() { return _value; }
  private:
    std::string _value;
  };
}