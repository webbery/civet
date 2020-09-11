#ifndef _CAXIOS_H_
#define _CAXIOS_H_
#include <string>
#include <thread>
#include "lmdb/lmdb.h"

namespace caxios {
  class CAxios {
  public:
    CAxios(const std::string& dbpath);
    ~CAxios();

    void Release();

    bool AddOrUpdateClass(const std::string& );
    bool DeleteClass(const std::string& );
    void GetClass();
    void GetNoClassifyFiles();

    bool AddOrUpdateTag();
    bool DeleteTag();
    void GetTag();
    void GetNoTagFiles();

    bool AddOrUpdateAnnotation();
    bool DeleteAnnotation();
    void GetAnotation();

    void GetTopFiles();

  private:
    void Run();

  private:
    MDB_env* m_pDBEnv = nullptr;
    MDB_txn *parentTransaction = nullptr;
    MDB_txn *transaction;
    std::thread* m_pWorker = nullptr;
  };
}

#endif
