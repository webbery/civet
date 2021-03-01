#ifndef _CAXIOS_LOG_H_
#define _CAXIOS_LOG_H_
#include <string>
#include <vector>
#include <deque>
#include <map>

#define CAXIOS_MAJOR_VERSION  1
#define CAXIOS_MINOR_VERSION  0

#if defined(__linux__) || defined(__APPLE__)
#define sprintf_s snprintf
#endif

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
    sprintf_s(clg, 1024, "[%s] [%u] [%s] [%s] [%s:%d] " fmt "\n", \
      caxios::current().c_str(),\
      caxios::threadid(),\
      module,\
      __FUNCTION__,\
      caxios::get_file_name(__FILE__).c_str(), \
      __LINE__, \
      ##__VA_ARGS__); \
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
  template<typename T>
  std::string format_vector(const std::deque<T>& vi) {
    std::string str;
    for (auto item : vi)
    {
      str += std::to_string(item);
      str += ",";
    }
    return str;
  }

  template<typename T>
  std::string format_vector(const std::map<std::string, T>& vi) {
    std::string str;
    for (auto item : vi)
    {
      str += "{" + item.first + ":" + std::to_string(item.second) + "}";
      str += ",";
    }
    return str;
  }

  std::string format_vector(const std::vector<std::string>& vi);
  std::string format_x16(const std::string& str);

  bool init_log(bool flag, bool enable = true);
  void log2file(const std::string& log);
  bool log_trace(const char* msg, char** str, int num);
  bool log_trace(const char* msg);
  void init_trace();
}

#endif
