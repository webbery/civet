#include "caxios.h"
#include <iostream>

namespace caxios {
  CAxios::CAxios(const std::string& dbpath) {
    std::cout<< "CAxios()"<<std::endl;
    mdb_env_create(&m_pDBEnv);
    if (const int rc = mdb_env_open(m_pDBEnv, dbpath.c_str(), MDB_NOTLS | MDB_RDONLY, 0664)) {
      //Error
    }
    if (const int rc = mdb_txn_begin(m_pDBEnv, parentTransaction, 0, &transaction)) {
        //Error
    }
    m_pWorker = new std::thread(&CAxios::Run, this);
  }

  CAxios::~CAxios() {
    std::cout<< "~CAxios()"<<std::endl;
  }

  void CAxios::Release() {
    std::cout<< "CAxios::Release()"<<std::endl;
    if (m_pWorker) {
      m_pWorker->join();
      delete m_pWorker;
      m_pWorker = nullptr;
    }
  }

  bool CAxios::AddOrUpdateClass(const std::string&) {
    return true;
  }

  void CAxios::Run() {
    int idx = 0;
    while(idx < 60) {
      std::this_thread::sleep_for(std::chrono::seconds(1));
      std::cout<<"---------work----------\n";
      idx ++;
    }
  }
}