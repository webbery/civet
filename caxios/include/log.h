#ifndef _CAXIOS_LOG_H_
#define _CAXIOS_LOG_H_
#include <string>
#include <vector>

#ifdef _DEBUG
#define T_LOG(module, fmt, ...) \
  printf("[%s] [%s:%d] [%u] [%s] [%s] "##fmt "\n",\
    caxios::current().c_str(),\
    caxios::get_file_name(__FILE__).c_str(),\
    __LINE__,\
    caxios::threadid(),\
    module,\
    __FUNCTION__,\
    __VA_ARGS__)
#else
#include <string.h>
#define T_LOG(module, fmt, ...)  {\
    char* clg = new char[1024];\
    memset(clg, 0, 1024);\
    sprintf(clg, "[%s] [%s:%d] [%u] [%s] " fmt "\n", \
      caxios::current().c_str(),\
      caxios::get_file_name(__FILE__).c_str(),\
      __LINE__,\
      caxios::threadid(),\
      module,\
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
  template<typename T>
  std::string format_vector(const std::vector<T>& vi) {
    std::string str;
    for (auto item : vi)
    {
      str += std::to_string(item);
      str += ",";
    }
    return str;
  }

  std::string format_vector(const std::vector<std::string>& vi);
  std::string format_x16(const std::string& str);

  bool init_log(bool flag);
  void log2file(const std::string& log);
}

#endif
