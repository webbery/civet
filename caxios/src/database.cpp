#include "database.h"
#include <iostream>
#ifdef __APPLE__
#include <sys/types.h>
#include <sys/stat.h>
#else
#include <filesystem>
#endif
#include "log.h"

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
    if (const int rc = mdb_env_open(m_pDBEnv, dbpath.c_str(), 0, 0664)) {
      std::cout << "mdb_env_open fail: " << err2str(rc) << std::endl;
    }
    if (const int rc = mdb_txn_begin(m_pDBEnv, parentTransaction, 0, &transaction)) {
      std::cout << "mdb_txn_begin fail: " << err2str(rc) << std::endl;
    }
    if (const int rc = mdb_dbi_open(transaction, nullptr, 0, &dbi)) {
      std::cout << "mdb_dbi_open fail: " << rc << std::endl;
    }
  }
  CDatabase::~CDatabase() {
    mdb_dbi_close(m_pDBEnv, dbi);
    mdb_env_close(m_pDBEnv);
    std::cout<<"~CDatabase()\n";
  }

  std::vector<CV_UINT> CDatabase::GenerateNextFilesID(int cnt) {
    std::vector<CV_UINT> filesID;
    return std::move(filesID);
  }

  bool CDatabase::Put(const std::string& ) {
    MDB_val key, data;
  }
}