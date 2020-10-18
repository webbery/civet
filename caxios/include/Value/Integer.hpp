#pragma once 
#include "Value.h"

namespace caxios {
  class Integer : public IValue {
  public:
    Integer(int64_t) :IValue(VTInteger) {}
    int64_t Get() { return _value; }

  private:
    int64_t _value;
  };
}