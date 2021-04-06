#pragma once
#include <string>
#include <functional>
#include "lmdb/lmdb.h"
#include "datum_type.h"
#include <thread>

#ifdef _DEBUG
#define MAX_SCHEMA_DB_SIZE  5*1024*1024
#define MAX_BIN_DB_SIZE     5*1024*1024
#else
#define MAX_SCHEMA_DB_SIZE  128*1024*1024
#define MAX_BIN_DB_SIZE     256*1024*1024
#endif

namespace caxios{
  class CDatabase;
  class CStorageProxy;
  class ITable;
  enum DMLType {
    DML_None,
    DML_Put,
    DML_Del
  };
  enum KeyType {
    KeyType_String,
    KeyType_UInt32
  };

  struct DML {
    DMLType _type;
    KeyType _ktype;
    std::string _dbname;
    std::string _key;
    std::string _data;
  };

  class CStorageProxy {
  public:
    CStorageProxy(const std::string& dbpath, const std::string& name, DBFlag flag, size_t size);
    ~CStorageProxy();

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

    bool TryUpdate();
  private:
    std::string realTableName(const std::string& name);
    MDB_dbi getDBI(const std::string& name);
    void initKeyword();
    bool ValidVersion();

    void UpgradeThread();
    void ExecuteDML(const DML&, std::map<std::string, MDB_dbi >&);

  private:
    std::map<std::string, MDB_dbi > m_mDBs;
    std::map<std::string, ITable*> m_mTables;
    std::map<std::string, std::string> m_mKeywordMap;

    std::string m_dir;
    std::string m_dbname;
    bool m_bExit = false;
    std::thread m_tUpgrade;


  private:
    CDatabase* m_pCurrent = nullptr;
    CDatabase* m_pUpgrade = nullptr;
  };
}