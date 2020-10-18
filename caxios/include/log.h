#ifndef _CAXIOS_LOG_H_
#define _CAXIOS_LOG_H_
#include <string>

#ifdef _DEBUG
#define T_LOG(fmt, ...) \
  printf("[%s] [%s:%d] [%u] [%s] "##fmt "\n",\
    caxios::current().c_str(),\
    caxios::get_file_name(__FILE__).c_str(),\
    __LINE__,\
    caxios::threadid(),\
    __FUNCTION__,\
    __VA_ARGS__)
#else
#define T_LOG(fmt, ...)  {\
    char* clg = new char[1024];\
    memset(clg, 0, 1024);\
    sprintf(clg, "[%s] [%s:%d] [%u] [%s] " fmt "\n", \
      caxios::current().c_str(),\
      caxios::get_file_name(__FILE__).c_str(),\
      __LINE__,\
      caxios::threadid(),\
      __FUNCTION__, ##__VA_ARGS__);\
    log2file(clg);\
    delete[] clg;\
  }
#endif

namespace caxios {
  std::string err2str(int err);

  std::string get_file_name(const char* pathname);
  std::string current();
  unsigned int threadid();

  void log2file(const std::string& log);
}

#endif
