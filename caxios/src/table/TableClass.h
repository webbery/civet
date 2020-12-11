#pragma once
#include "Table.h"
#include "lmdb/lmdb.h"

namespace caxios {
  class TableClass : public ITable {
  public:
    TableClass(CDatabase* pDatabase, const std::string& name);
    virtual ~TableClass() {}

    virtual bool Add(const std::string& value, const std::vector<FileID>& fileid);
    virtual bool Update(const std::string& current, const UpdateValue& value);
    virtual bool Delete(const std::string& k, FileID fileID);
    virtual bool Query(const std::string& k, std::vector<FileID>& filesID);

  private:
  private:
    MDB_dbi _dbi = 0;
  };
}