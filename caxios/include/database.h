#ifndef _CAXIOS_DATABASE_H_
#define _CAXIOS_DATABASE_H_
#include "lmdb/lmdb.h"
#include <string>
#include <vector>
#include <map>
#include <functional>
#include "datum_type.h"

namespace caxios{
  class ITable;
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
    void CloseDatabase(const std::string& dbname);

    bool Put(const std::string& dbname, uint32_t key, void* pData, uint32_t len, int flag = MDB_CURRENT);
    bool Put(const std::string& dbname, const std::string&, void* pData, uint32_t len, int flag = MDB_CURRENT);
    bool Get(const std::string& dbname, uint32_t key, void*& pData, uint32_t& len);
    bool Get(const std::string& dbname, const std::string& key, void*& pData, uint32_t& len);
    bool Filter(const std::string& dbname, std::function<bool(uint32_t key, void* pData, uint32_t len)> cb);
    bool Filter(const std::string& dbname, std::function<bool(const std::string& key, void* pData, uint32_t len)> cb);
    bool Del(const std::string& dbname, uint32_t key);
    bool Del(const std::string& dbname, const std::string& key);
    MDB_cursor* OpenCursor(const std::string& dbname);
    int MoveNext(MDB_cursor*, MDB_val&, MDB_val&);
    void CloseCursor(MDB_cursor*);
    MDB_txn* Begin();
    bool Commit();

    ITable* GetMetaTable(const std::string& name);
    ITable* GetOrCreateMetaTable(const std::string& name, const std::string& type);
    std::map<std::string, caxios::WordIndex> GetWordsIndex(const std::vector<std::string>& words);

  private:
    std::string realTableName(const std::string& name);
    void initKeyword();

  private:
    MDB_env* m_pDBEnv = nullptr;
    unsigned int m_flag = 0;
    MDB_txn* m_pTransaction = nullptr;
    DATABASE_OPERATOR m_dOperator = NORMAL;
    std::map<std::string, MDB_dbi > m_mDBs;
    std::map<std::string, ITable*> m_mTables;
    std::map<std::string, std::string> m_mKeywordMap;
  };
}

#endif