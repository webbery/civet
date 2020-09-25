#include "database.h"
#include <iostream>
#ifdef __APPLE__
#include <sys/types.h>
#include <sys/stat.h>
#else
#include <filesystem>
#endif
#include "log.h"

#define MAX_NUM_DATABASE  4

#define TABLE_FILEID     32   // "file_cur_id"
#define TABLE_FILESNAP   33   // "file_snap"

namespace caxios {

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
    if (const int rc = mdb_txn_begin(m_pDBEnv, m_pParentTransaction, 0, &m_pTransaction)) {
      std::cout << "mdb_txn_begin fail: " << err2str(rc) << std::endl;
    }
  }
  CDatabase::~CDatabase() {
    mdb_txn_commit(m_pTransaction);
    mdb_close(m_pDBEnv, dbi);
    mdb_env_close(m_pDBEnv);
    std::cout<<"~CDatabase()\n";
  }

  std::vector<CV_UINT> CDatabase::GenerateNextFilesID(int cnt) {
    std::vector<CV_UINT> filesID;
    void* pData = nullptr;
    CV_UINT lastID = 0;
    size_t len = 0;
    if (this->Get(TABLE_FILEID, pData, len)) {
      if (pData != nullptr) {
        lastID = *(CV_UINT*)pData;
      }
    }
    for (int idx = 0; idx < cnt; ++idx) {
      lastID += 1;
      filesID.emplace_back(lastID);
    }
    if (!this->Put(TABLE_FILEID, &lastID, sizeof(CV_UINT), MDB_APPENDDUP)) {
    }
    return std::move(filesID);
  }

  bool CDatabase::SwitchDatabase(const std::string& dbname)
  {
    if (dbi != -1) {
      mdb_txn_commit(m_pTransaction);
      mdb_dbi_close(m_pDBEnv, dbi);
    }
    if (const int rc = mdb_dbi_open(m_pTransaction, dbname.c_str(), MDB_CREATE | MDB_INTEGERKEY | MDB_DUPSORT, &dbi)) {
      std::cout << "mdb_dbi_open fail: " << err2str(rc) << ", dbname: "<< dbname<< std::endl;
      return false;
    }
    return true;
  }

  bool CDatabase::Put(size_t k, void* pData, size_t len, int flag) {
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
    if (falg == MDB_CURRENT) { // update value of key
      rc = mdb_cursor_get(cursor, &key, &datum, MDB_FIRST);
      datum.mv_data = pData;
      datum.mv_size = len;
      int cursor_flag = 0;
      if (rc != MDB_NOTFOUND) {
        cursor_flag = MDB_CURRENT;
      }
      if (int rc = mdb_cursor_put(cursor, &key, &datum, cursor_flag)) {
        std::cout << "mdb_put fail: " << err2str(rc) << std::endl;
        m_dOperator = NORMAL;
        mdb_cursor_close(cursor);
        return false;
      }
    }
    // append value to key
    if (int rc = mdb_cursor_put(cursor, &key, &datum, 0)) {
      std::cout << "mdb_put fail: " << err2str(rc) << std::endl;
      m_dOperator = NORMAL;
      mdb_cursor_close(cursor);
      return false;
    }
    mdb_cursor_close(cursor);
    return true;
  }

  bool CDatabase::Get(size_t k, void*& pData, size_t& len)
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

  bool CDatabase::Del(size_t key)
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