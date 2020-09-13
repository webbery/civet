#ifndef _CAXIOS_DATABASE_H_
#define _CAXIOS_DATABASE_H_
#include "lmdb/lmdb.h"

namespace caxios{
  class CDatabase {
  private:
    MDB_env* m_pDBEnv;
    MDB_txn* parentTransaction;
    MDB_txn* transaction;
    MDB_dbi dbi;
  };
}

#endif