#ifndef _CAXIOS_DATABASE_H_
#define _CAXIOS_DATABASE_H_
#include "lmdb/lmdb.h"
#include <string>
#include <vector>
#include <map>
#include <functional>
#include "datum_type.h"

namespace caxios{

  enum DATABASE_OPERATOR {
    NORMAL = 0,     // 未操作状态
    TRANSACTION,    // 有数据写入, 待提交
  };

  class CDatabase {
  public:
    CDatabase(const std::string& dbpath);
    ~CDatabase();

    MDB_dbi OpenDatabase(const std::string& dbname);
    void CloseDatabase(MDB_dbi);

    bool Put(MDB_dbi dbi, size_t key, void* pData, size_t len, int flag = MDB_CURRENT);
    bool Get(MDB_dbi dbi, size_t key, void*& pData, size_t& len);
    bool Each(MDB_dbi dbi, std::function<void(size_t key, void* pData, size_t len)> cb);
    bool Del(MDB_dbi dbi, size_t key);
    bool Commit();

  private:
    MDB_env* m_pDBEnv = nullptr;
    MDB_txn* m_pParentTransaction = nullptr;
    MDB_txn* m_pTransaction = nullptr;
    DATABASE_OPERATOR m_dOperator = NORMAL;
  };
}

#endif