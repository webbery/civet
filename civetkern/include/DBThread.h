#pragma once
#include <thread>
#include <map>
#include <string>
#include "lmdb/lmdb.h"
#include "database.h"

namespace caxios {
  class DBThread {
  public:
    DBThread();
    ~DBThread();

    void AddTask(std::function<void(CDatabase* pDatabase)>);

  private:
    void Run();

  private:
    std::thread* _thread;
    CDatabase* m_pDatabase = nullptr;
    std::map<std::string, MDB_dbi> m_mDBs;
  };
}