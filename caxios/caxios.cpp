#include "caxios.h"
#include <iostream>

namespace caxios {
  CAxios::CAxios(std::string dbpath) {
    std::cout<< "CAxios()"<<std::endl;
    mdb_env_create(&m_pDBEnv);
#define MAX_EXPAND_DB_SIZE  50*1024*1024
    if (const int rc = mdb_env_set_mapsize(m_pDBEnv, MAX_EXPAND_DB_SIZE)) {
      std::cout << "mdb_env_set_mapsize fail: " << rc << std::endl;
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

  CAxios::~CAxios() {
    std::cout<< "~CAxios()"<<std::endl;
  }

  void CAxios::Release() {
    std::cout<< "CAxios::Release()"<<std::endl;
    mdb_dbi_close(m_pDBEnv, dbi);
    mdb_env_close(m_pDBEnv);
  }

  bool CAxios::AddOrUpdateClass(const std::string&) {
    return true;
  }

  void CAxios::Run() {
    // int idx = 0;
    // std::cout<<"---------Run----------\n";
    // while(idx < 60) {
    //   std::this_thread::sleep_for(std::chrono::seconds(1));
    //   std::cout<<"---------work----------\n";
    //   idx++;
    // }
  }
}