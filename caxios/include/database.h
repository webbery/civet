#ifndef _CAXIOS_DATABASE_H_
#define _CAXIOS_DATABASE_H_
#include "lmdb/lmdb.h"
#include <string>
#include <vector>
#include <map>
#include <functional>
#include "datum_type.h"

namespace caxios{
  enum DBFlag {
    ReadWrite,
    ReadOnly
  };

  enum DATABASE_OPERATOR {
    NORMAL = 0,     // 未操作状态
    TRANSACTION,    // 有数据写入, 待提交
  };

  class CDatabase {
  public:
    CDatabase(const std::string& dbpath, const std::string& name, DBFlag flag, size_t size);
    ~CDatabase();

    MDB_dbi OpenDatabase(const std::string& dbname);
    void CloseDatabase(MDB_dbi dbi);

    bool Put(MDB_dbi dbi, uint32_t key, void* pData, uint32_t len, int flag = MDB_CURRENT);
    bool Put(MDB_dbi dbi, const std::string&, void* pData, uint32_t len, int flag = MDB_CURRENT);
    bool Get(MDB_dbi dbi, uint32_t key, void*& pData, uint32_t& len);
    bool Get(MDB_dbi dbi, const std::string& key, void*& pData, uint32_t& len);
    bool Filter(MDB_dbi dbi, std::function<bool(uint32_t key, void* pData, uint32_t len)> cb);
    bool Filter(MDB_dbi dbi, std::function<bool(const std::string& key, void* pData, uint32_t len)> cb);
    bool Del(MDB_dbi dbi, uint32_t key);
    bool Del(MDB_dbi dbi, const std::string& key);
    MDB_cursor* OpenCursor(MDB_dbi);
    int MoveNext(MDB_cursor*, MDB_val&, MDB_val&);
    void CloseCursor(MDB_cursor*);
    MDB_txn* Begin();
    bool Commit();

  private:
    MDB_env* m_pDBEnv = nullptr;
    unsigned int m_flag = 0;
    MDB_txn* m_pTransaction = nullptr;
    DATABASE_OPERATOR m_dOperator = NORMAL;
  };
}

#endif