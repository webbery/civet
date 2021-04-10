#pragma once
#include "Table.h"

namespace caxios {
  class TableSnap : public ITable {
  public:
    TableSnap(CDatabase* pDatabase, const std::string& name);
    virtual ~TableSnap();

    virtual bool Add(const std::string& value, FileID fileid);
    virtual bool Update();
    virtual bool Delete(const std::string& k);
    virtual bool Query(const std::string& k, std::vector<FileID>& filesID);
  private:
    MDB_dbi _dbi = 0;
  };
}