#pragma once

namespace caxios {
  class Cache {
  public:
    Cache* GetInstance();
    ~Cache();

  private:
    Cache();

  private:
//#if defined(__APPLE__) || defined(__gnu_linux__) || defined(__linux__) 
//#elif defined(WIN32)
//    HANDLE m_pHandle = nullptr;
//    LPVOID m_pBuffer = nullptr;
//#endif

  };
}