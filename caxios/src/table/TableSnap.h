#pragma once
#include "Table.h"

namespace caxios {
  class TableSnap : public ITable {
  public:
    TableSnap(CDatabase* pDatabase, MDB_dbi dbi);
    virtual ~TableSnap();

    virtual bool Add();
    virtual bool Update();
    virtual bool Delete();
    virtual bool Query();
  private:
    MDB_dbi _dbi = 0;
    CDatabase* _pDatabase = nullptr;
  };
}