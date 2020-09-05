#include "caxios.h"
#include <iostream>

namespace caxios {
  CAxios::CAxios() {
    std::cout<< "CAxios()"<<std::endl;
  }

  CAxios::~CAxios() {
    std::cout<< "~CAxios()"<<std::endl;
  }

  void CAxios::Release() {
    std::cout<< "CAxios::Release()"<<std::endl;
  }
}