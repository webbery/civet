#include "database.h"
#include <iostream>
#include <experimental/filesystem>

namespace caxios {
//   namespace fs = std::filesystem;

  CDatabase::CDatabase(const std::string& dbpath) {
    // if (!fs::exists(dbpath)) {
    //   fs::create_directory(dbpath);
    // }
    mdb_env_create(&m_pDBEnv);
#define MAX_EXPAND_DB_SIZE  50*1024*1024
    if (const int rc = mdb_env_set_mapsize(m_pDBEnv, MAX_EXPAND_DB_SIZE)) {
      std::cout << "mdb_env_set_mapsize fail: " << rc << std::endl;
      mdb_env_close(m_pDBEnv);
      return;
    }
    if (const int rc = mdb_env_open(m_pDBEnv, dbpath.c_str(), MDB_NOTLS | MDB_RDONLY, 0664)) {
      std::cout << "mdb_env_open fail: " << rc << std::endl;
    }
    if (const int rc = mdb_txn_begin(m_pDBEnv, parentTransaction, 0, &transaction)) {
      std::cout << "mdb_txn_begin fail: " << rc << std::endl;
    }
    if (const int rc = mdb_dbi_open(transaction, nullptr, 0, &dbi)) {
      std::cout << "mdb_dbi_open fail: " << rc << std::endl;
    }
  }
  CDatabase::~CDatabase() {
    mdb_dbi_close(m_pDBEnv, dbi);
    mdb_env_close(m_pDBEnv);
  }

  std::vector<CV_UINT> CDatabase::GenerateNextFilesID(int cnt) {
    std::vector<CV_UINT> filesID;
    return std::move(filesID);
  }
}