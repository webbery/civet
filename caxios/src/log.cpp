#include "log.h"
#include "lmdb/lmdb.h"

namespace caxios {
  std::string err2str(int err) {
    if (err > 0) {
      return strerror(err);
    }
    else {
      return mdb_strerror(err);
    }
  }
}