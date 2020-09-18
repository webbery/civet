#ifndef _CAXIOS_DATABASE_H_
#define _CAXIOS_DATABASE_H_
#include "lmdb/lmdb.h"
#include <string>
#include <vector>

namespace caxios{

  typedef unsigned int CV_UINT;

  class CDatabase {
  public:
    CDatabase(const std::string& dbpath);
    ~CDatabase();

    std::vector<CV_UINT> GenerateNextFilesID(int cnt = 1);

    bool Put(const std::string& key);

  private:
    MDB_env* m_pDBEnv = nullptr;
    MDB_txn* parentTransaction = nullptr;
    MDB_txn* transaction = nullptr;
    MDB_dbi dbi;
    MDB_cursor *cursor = nullptr;
  };
}

#endif