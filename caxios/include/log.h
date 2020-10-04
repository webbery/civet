#ifndef _CAXIOS_LOG_H_
#define _CAXIOS_LOG_H_
#include <string>

#define T_LOG(fmt, ...) \
  printf("[%s] [%s:%d] [%u] [%s] "##fmt "\n",\
    caxios::current().c_str(),\
    caxios::get_file_name(__FILE__).c_str(),\
    __LINE__,\
    caxios::threadid(),\
    __FUNCTION__,\
    __VA_ARGS__)

namespace caxios {
  std::string err2str(int err);

  std::string get_file_name(const char* pathname);
  std::string current();
  unsigned int threadid();
}

#endif
