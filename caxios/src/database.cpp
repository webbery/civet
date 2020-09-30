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
    T_LOG("log test");
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
    if (const int rc = mdb_txn_begin(m_pDBEnv, m_pParentTransaction, 0, &m_pTransaction)) {
      std::cout << "mdb_txn_begin fail: " << err2str(rc) << std::endl;
    }
  }
  CDatabase::~CDatabase() {

    std::cout<<"~CDatabase()\n";
  }

  MDB_dbi CDatabase::OpenDatabase(const std::string& dbname)
  {
    MDB_dbi dbi = -1;
    if (const int rc = mdb_dbi_open(m_pTransaction, dbname.c_str(), MDB_CREATE | MDB_INTEGERKEY | MDB_DUPSORT, &dbi)) {
      std::cout << "mdb_dbi_open fail: " << err2str(rc) << ", dbname: "<< dbname<< std::endl;
      return -1;
    }
    return dbi;
  }

  void CDatabase::CloseDatabase(MDB_dbi dbi)
  {
    this->Commit();
    mdb_close(m_pDBEnv, dbi);
    mdb_env_close(m_pDBEnv);
  }

  bool CDatabase::Put(MDB_dbi dbi, size_t k, void* pData, size_t len, int flag) {
    MDB_cursor* cursor = nullptr;
    int rc = 0;
    if (rc = mdb_cursor_open(m_pTransaction, dbi, &cursor)) {
      std::cout << "mdb_cursor_open fail: " << err2str(rc) << std::endl;
      return false;
    }
    if (m_dOperator == NORMAL) {
      m_dOperator = TRANSACTION;
    }
    MDB_val key, datum;
    key.mv_data = reinterpret_cast<void*>(&k);
    key.mv_size = sizeof(size_t);
    int cursor_flag = 0;
    if (flag == MDB_CURRENT) { // update value of key
      rc = mdb_cursor_get(cursor, &key, &datum, MDB_FIRST);
      if (rc != MDB_NOTFOUND) {
        cursor_flag = MDB_CURRENT;
      }
    }
    datum.mv_data = pData;
    datum.mv_size = len;
    if (int rc = mdb_cursor_put(cursor, &key, &datum, cursor_flag)) {
      std::cout << "mdb_put fail: " << err2str(rc) << std::endl;
      m_dOperator = NORMAL;
      mdb_cursor_close(cursor);
      return false;
    }
    mdb_cursor_close(cursor);
    return true;
  }

  bool CDatabase::Get(MDB_dbi dbi, size_t k, void*& pData, size_t& len)
  {
    MDB_cursor* cursor = nullptr;
    int rc = 0;
    if (rc = mdb_cursor_open(m_pTransaction, dbi, &cursor)) {
      std::cout << "mdb_cursor_open fail: " << err2str(rc) << std::endl;
      return false;
    }
    MDB_val key, datum;
    key.mv_data = reinterpret_cast<void*>(&k);
    key.mv_size = sizeof(size_t);
    //while ((rc = )==0) {
    //  printf("key: %p %.*s, data: %p %.*s\n",
    //    key.mv_data, (int)key.mv_size, (char*)key.mv_data,
    //    datum.mv_data, (int)datum.mv_size, (char*)datum.mv_data);
    //}
    if (rc = mdb_cursor_get(cursor, &key, &datum, MDB_LAST)) {
      std::cout << "mdb_get fail: " << err2str(rc) << std::endl;
      mdb_cursor_close(cursor);
      return false;
    }
    len = datum.mv_size;
    pData = datum.mv_data;
    mdb_cursor_close(cursor);
    return true;
  }

  bool CDatabase::Each(MDB_dbi dbi, std::function<void(size_t key, void* pData, size_t len)> cb)
  {
    MDB_cursor* cursor = nullptr;
    int rc = 0;
    if (rc = mdb_cursor_open(m_pTransaction, dbi, &cursor)) {
      std::cout << "mdb_cursor_open fail: " << err2str(rc) << std::endl;
      return false;
    }
    return true;
  }

  bool CDatabase::Del(MDB_dbi dbi, size_t key)
  {
    return true;
  }

  bool CDatabase::Commit()
  {
    if (m_dOperator == NORMAL) return true;
    if (int rc = mdb_txn_commit(m_pTransaction)){
      std::cout << "mdb_txn_commit fail: " << rc << std::endl;
      return false;
    }
    m_dOperator = NORMAL;
    return true;
  }

}