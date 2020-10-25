#pragma once
#include "Table.h"
#include "lmdb/lmdb.h"

namespace caxios {
  class TableTag : public ITable {
  public:
    TableTag(CDatabase* pDatabase, const std::string& name);
    virtual ~TableTag() {}

    virtual bool Add(const std::string& value, const std::vector<FileID>& fileid);
    virtual bool Update();
    virtual bool Delete(const std::string& k);
    virtual bool Query(const std::string& k, std::vector<FileID>& filesID);
  private:
    MDB_dbi _dbi = 0;
  };
}