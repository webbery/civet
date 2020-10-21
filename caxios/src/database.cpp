#include "database.h"
#include <iostream>
#ifdef __APPLE__
#include <sys/types.h>
#include <sys/stat.h>
#else
// if defined(_HAS_CXX17) && _HAS_CXX17
// #include <filesystem>
// namespace fs = std::filesystem;
// #else
#include <experimental/filesystem>
namespace fs = std::experimental::filesystem;
// #endif  // _HAS_CXX17
#endif
#include "log.h"

#define MAX_NUM_DATABASE  32

namespace caxios {
  enum MetaType {
    BT_BINARY,
    BT_STRING,
    BT_VALUE
  };

  CDatabase::CDatabase(const std::string& dbpath, DBFlag flag) {
#ifdef __APPLE__
    int status = mkdir(dbpath.c_str(), S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH);
#else
    if (!fs::exists(dbpath)) {
      fs::create_directory(dbpath);
    }
    else {
      if (flag == DBFlag::ReadOnly) m_flag = MDB_RDONLY;
      else m_flag = MDB_NOSYNC;
    }
#endif
    mdb_env_create(&m_pDBEnv);
    mdb_env_set_maxreaders(m_pDBEnv, 4);
#ifdef _DEBUG
#define MAX_EXPAND_DB_SIZE  50*1024*1024
#else
#define MAX_EXPAND_DB_SIZE  1*1024*1024*1024
#endif
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
    //open_flag |= MDB_NOTLS;
    T_LOG("Open DB %s, flag: %d", dbpath.c_str(), m_flag);
    if (const int rc = mdb_env_open(m_pDBEnv, dbpath.c_str(), m_flag | MDB_NOLOCK, 0664)) {
      T_LOG("mdb_env_open fail: %s", err2str(rc).c_str());
    }
    if (const int rc = mdb_txn_begin(m_pDBEnv, 0, m_flag, &m_pTransaction)) {
      T_LOG("mdb_txn_begin fail: %s", err2str(rc).c_str());
    }
  }
  CDatabase::~CDatabase() {
    mdb_env_close(m_pDBEnv);
    T_LOG("~CDatabase()");
  }

  MDB_dbi CDatabase::OpenDatabase(const std::string& dbname)
  {
    MDB_dbi dbi = -1;
    unsigned int flag = MDB_CREATE;
    if (m_flag & MDB_RDONLY) flag = 0;
    if (const int rc = mdb_dbi_open(m_pTransaction, dbname.c_str(), flag | MDB_INTEGERKEY, &dbi)) {
      T_LOG("mdb_dbi_open %s fail %s", dbname.c_str(), err2str(rc).c_str());
      return dbi;
    }
    T_LOG("mdb_dbi_open %d, %s", dbi, dbname.c_str());
    return dbi;
  }

  void CDatabase::CloseDatabase(MDB_dbi dbi)
  {
    this->Commit();
    mdb_env_sync(m_pDBEnv, 1);
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
      T_LOG("mdb_put fail: %s, key: %u", err2str(rc).c_str(), k);
      return false;
    }
    if (m_dOperator == NORMAL) {
      m_dOperator = TRANSACTION;
    }
    T_LOG("mdb_put %d, key: %u", dbi, k);
    return true;
  }

  bool CDatabase::Put(MDB_dbi dbi, const std::string& k, void* pData, uint32_t len, int flag /*= MDB_CURRENT*/)
  {
    MDB_val key, datum;
    key.mv_data = (void*)(k.data());
    key.mv_size = k.size();
    datum.mv_data = pData;
    datum.mv_size = len;
    if (int rc = mdb_put(m_pTransaction, dbi, &key, &datum, 0)) {
      T_LOG("mdb_put fail: %s, key: %s", err2str(rc).c_str(), k.c_str());
      return false;
    }
    if (m_dOperator == NORMAL) {
      m_dOperator = TRANSACTION;
    }
    T_LOG("mdb_put %d, key: %s", dbi, k.c_str());
    return true;
  }

  bool CDatabase::Get(MDB_dbi dbi, uint32_t k, void*& pData, uint32_t& len)
  {
    MDB_val key, datum = { 0 };
    key.mv_data = reinterpret_cast<void*>(&k);
    key.mv_size = sizeof(uint32_t);
    this->Begin();
    if (int rc = mdb_get(m_pTransaction, dbi, &key, &datum)) {
      T_LOG("mdb_get fail: %s", err2str(rc).c_str());
      return false;
    }
    len = datum.mv_size;
    pData = datum.mv_data;
    T_LOG("mdb_get %d, key: %u, len: %d", dbi, k, len);
    return true;
  }

  bool CDatabase::Get(MDB_dbi dbi, const std::string& k, void*& pData, uint32_t& len)
  {
    MDB_val key, datum = { 0 };
    key.mv_data = (void*)(k.data());
    key.mv_size = k.size();
    this->Begin();
    if (int rc = mdb_get(m_pTransaction, dbi, &key, &datum)) {
      T_LOG("mdb_get fail: %s", err2str(rc).c_str());
      return false;
    }
    len = datum.mv_size;
    pData = datum.mv_data;
    T_LOG("mdb_get %d, key: %u, len: %d", dbi, k, len);
    return true;
  }

  bool CDatabase::Each(MDB_dbi dbi, std::function<bool(uint32_t key, void* pData, uint32_t len)> cb)
  {
    MDB_cursor* cursor = nullptr;
    int rc = 0;
    this->Begin();
    if (rc = mdb_cursor_open(m_pTransaction, dbi, &cursor)) {
      T_LOG("mdb_cursor_open fail: %s, transaction: %d", err2str(rc).c_str(), m_pTransaction);
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

  bool CDatabase::Del(MDB_dbi dbi, uint32_t k)
  {
    MDB_val key, datum = { 0 };
    key.mv_data = reinterpret_cast<void*>(&k);
    key.mv_size = sizeof(uint32_t);

    if (int rc = mdb_del(m_pTransaction, dbi, &key, NULL)) {
      T_LOG("mdb_del fail: %s", err2str(rc).c_str());
      return false;
    }
    return true;
  }

  MDB_txn* CDatabase::Begin()
  {
    if (m_pTransaction == nullptr) {
      if (int rc = mdb_txn_begin(m_pDBEnv, 0, m_flag, &m_pTransaction)) {
        T_LOG("mdb_txn_begin: %s", err2str(rc).c_str());
        return nullptr;
      }
      return m_pTransaction;
    }
    return nullptr;
  }

  bool CDatabase::Commit()
  {
    if (m_dOperator == NORMAL) return true;
    if (int rc = mdb_txn_commit(m_pTransaction)) {
      T_LOG("mdb_txn_commit: %s", err2str(rc).c_str());
      return false;
    }
    m_pTransaction = nullptr;
    T_LOG("mdb_txn_commit");
    m_dOperator = NORMAL;
    return true;
  }

}