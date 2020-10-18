#pragma once 
#include "Value.h"

namespace caxios {
  class Date : public IValue {
  public:
    uint64_t Get() { return _value; }

  private:
    uint64_t _value;
  };
}