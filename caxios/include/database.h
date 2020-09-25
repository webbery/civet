#ifndef _CAXIOS_DATABASE_H_
#define _CAXIOS_DATABASE_H_
#include "lmdb/lmdb.h"
#include <string>
#include <vector>

namespace caxios{

  typedef unsigned int CV_UINT;

  enum DATABASE_OPERATOR {
    NORMAL = 0,     // 未操作状态
    TRANSACTION,    // 有数据写入, 待提交
  };

  class CDatabase {
  public:
    CDatabase(const std::string& dbpath);
    ~CDatabase();

    std::vector<CV_UINT> GenerateNextFilesID(int cnt = 1);
    bool SwitchDatabase(const std::string& dbname);

  private:
    bool Put(size_t key, void* pData, size_t len);
    bool Add(size_t key, void* pData, size_t len);
    bool Get(size_t key, void*& pData, size_t& len);
    bool Del(size_t key);
    bool Commit();

  private:
    MDB_env* m_pDBEnv = nullptr;
    MDB_txn* m_pParentTransaction = nullptr;
    MDB_txn* m_pTransaction = nullptr;
    MDB_dbi dbi = -1;
    DATABASE_OPERATOR m_dOperator = NORMAL;
  };
}

#endif