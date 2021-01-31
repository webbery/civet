#pragma once
#include "Table.h"
#include "lmdb/lmdb.h"

namespace caxios {
  class TableTag : public ITable {
  public:
    TableTag(CDatabase* pDatabase);
    virtual ~TableTag();

    virtual bool Add(const std::string& value, const std::vector<FileID>& fileid);
    virtual bool Update(const std::string& current, const UpdateValue& value);
    virtual bool Delete(const std::string& k, FileID fileID);
    virtual bool Query(const std::string& k, std::vector<FileID>& filesID, std::vector<std::string>& vChildren);
    virtual Iterator begin();
    virtual Iterator end();
  private:
    std::map<std::string, MDB_dbi> _dbi;
  };
}