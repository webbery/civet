#include "database.h"
#include <iostream>
#ifdef __APPLE__
#include <sys/types.h>
#include <sys/stat.h>
#else
#include <filesystem>
#endif
#include "log.h"

#define MAX_NUM_DATABASE  32

namespace caxios {
  enum MetaType {
    BT_BINARY,
    BT_STRING,
    BT_VALUE
  };

  CDatabase::CDatabase(const std::string& dbpath) {
#ifdef __APPLE__
    int status = mkdir(dbpath.c_str(), S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH);
#else
    namespace fs = std::filesystem;
    if (!fs::exists(dbpath)) {
      fs::create_directory(dbpath);
    }
#endif
    mdb_env_create(&m_pDBEnv);
#define MAX_EXPAND_DB_SIZE  50*1024*1024
    if (const int rc = mdb_env_set_mapsize(m_pDBEnv, MAX_EXPAND_DB_SIZE)) {
      std::cout << "mdb_env_set_mapsize fail: " << err2str(rc) << std::endl;
      mdb_env_close(m_pDBEnv);
      return;
    }
    if (const int rc = mdb_env_set_maxdbs(m_pDBEnv, MAX_NUM_DATABASE)) {
      std::cout << "mdb_env_set_maxdbs fail: " << err2str(rc) << std::endl;
      mdb_env_close(m_pDBEnv);
      return;
    }
    if (const int rc = mdb_env_open(m_pDBEnv, dbpath.c_str(), 0, 0664)) {
      std::cout << "mdb_env_open fail: " << err2str(rc) << std::endl;
    }
    if (const int rc = mdb_txn_begin(m_pDBEnv, 0, 0, &m_pTransaction)) {
      std::cout << "mdb_txn_begin fail: " << err2str(rc) << std::endl;
    }
  }
  CDatabase::~CDatabase() {
    mdb_env_close(m_pDBEnv);
    T_LOG("~CDatabase()");
  }

  MDB_dbi CDatabase::OpenDatabase(const std::string& dbname)
  {
    MDB_dbi dbi = -1;
    if (const int rc = mdb_dbi_open(m_pTransaction, dbname.c_str(), MDB_CREATE | MDB_INTEGERKEY, &dbi)) {
      T_LOG("mdb_dbi_open %s fail %s", dbname.c_str(), err2str(rc).c_str());
      return dbi;
    }
    T_LOG("mdb_dbi_open %d, %s", dbi, dbname.c_str());
    return dbi;
  }

  void CDatabase::CloseDatabase(MDB_dbi dbi)
  {
    this->Commit(m_pTransaction);
    T_LOG("mdb_close %d", dbi);
    //mdb_close(m_pDBEnv, dbi);
  }

  bool CDatabase::Put(MDB_dbi dbi, uint32_t k, void* pData, uint32_t len, int flag) {
    MDB_val key, datum;
    key.mv_data = reinterpret_cast<void*>(&k);
    key.mv_size = sizeof(uint32_t);
    datum.mv_data = pData;
    datum.mv_size = len;
    if (int rc = mdb_put(m_pTransaction, dbi, &key, &datum, 0)) {
      T_LOG("mdb_put fail: %d, key: %u", err2str(rc).c_str(), k);
      return false;
    }
    if (m_dOperator == NORMAL) {
      m_dOperator = TRANSACTION;
    }
    T_LOG("mdb_cursor_put %d, key: %u", dbi, k);
    return true;
  }

  bool CDatabase::Get(MDB_dbi dbi, uint32_t k, void*& pData, uint32_t& len)
  {
    MDB_val key, datum = { 0 };
    key.mv_data = reinterpret_cast<void*>(&k);
    key.mv_size = sizeof(uint32_t);
    if (int rc = mdb_get(m_pTransaction, dbi, &key, &datum)) {
      T_LOG("mdb_get fail: %s", err2str(rc).c_str());
      return false;
    }
    len = datum.mv_size;
    pData = datum.mv_data;
    return true;
  }

  bool CDatabase::Each(MDB_dbi dbi, std::function<bool(uint32_t key, void* pData, uint32_t len)> cb)
  {
    MDB_cursor* cursor = nullptr;
    int rc = 0;
    if (rc = mdb_cursor_open(m_pTransaction, dbi, &cursor)) {
      std::cout << "mdb_cursor_open fail: " << err2str(rc) << std::endl;
      return false;
    }

    MDB_val key, datum = { 0 };
    while ((rc = mdb_cursor_get(cursor, &key, &datum, MDB_NEXT)) == 0) {
      //printf("key: %u, data: %d %s\n",
      //  *(uint32_t*)(key.mv_data),
      //  (int)datum.mv_size, (char*)datum.mv_data);
      if (cb(*(uint32_t*)(key.mv_data), datum.mv_data, datum.mv_size)) {
        break;
      }
    }
    mdb_cursor_close(cursor);
    return true;
  }

  bool CDatabase::Del(MDB_dbi dbi, uint32_t key)
  {
    return true;
  }

  MDB_txn* CDatabase::Begin()
  {
    MDB_txn* pTxn = nullptr;
    if (int rc = mdb_txn_begin(m_pDBEnv, 0, MDB_NOSYNC, &pTxn)) {
      T_LOG("mdb_txn_begin: %s", err2str(rc).c_str());
      return nullptr;
    }
    return pTxn;
  }

  bool CDatabase::Commit(MDB_txn* pTxn)
  {
    if (m_dOperator == NORMAL) return true;
    if (int rc = mdb_txn_commit(pTxn)) {
      T_LOG("mdb_txn_commit: %s", err2str(rc).c_str());
      return false;
    }
    T_LOG("mdb_txn_commit");
    m_dOperator = NORMAL;
    return true;
  }

}