#include "log.h"
#include "lmdb/lmdb.h"
#include <chrono>
#include <ctime>
#include <iostream>
#include <thread>

namespace caxios {
  std::string err2str(int err) {
    if (err > 0) {
      return strerror(err);
    }
    else {
      return mdb_strerror(err);
    }
  }

  std::string get_file_name(const char* pathname) {
    std::string fullpath(pathname);
#ifdef WIN32
    size_t pos = fullpath.find_last_of('\\');
#elif __APPLE__
    size_t pos = fullpath.find_last_of('/');
#endif
    return fullpath.substr(pos + 1, fullpath.size() - pos - 1);
  }

  std::string current()
  {
    using namespace std::chrono;
    auto n = system_clock::now();
    system_clock::duration tp = n.time_since_epoch();
    tp -= duration_cast<seconds>(tp);
    time_t tt = system_clock::to_time_t(n);
    tm t = *gmtime(&tt);
    char buf[64] = { 0 };
    sprintf(buf, "%04u-%02u-%02u %02u:%02u:%02u.%03u", t.tm_year + 1900,
      t.tm_mon + 1, t.tm_mday, t.tm_hour, t.tm_min, t.tm_sec,
      static_cast<unsigned>(tp / std::chrono::milliseconds(1)));
    return std::string(buf);
  }

  unsigned int threadid() {
    auto tid = std::this_thread::get_id();
    return *(_Thrd_id_t*)&tid;
  }
}