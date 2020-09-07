#ifndef _CAXIOS_H_
#define _CAXIOS_H_
#include "memory/SharedMemory.h"

namespace caxios {
  class CAxios {
  public:
    CAxios();
    ~CAxios();

    void Release();

  private:


  private:
    CSharedMemory* m_pSharedMemory = nullptr;
  };
}

#endif
