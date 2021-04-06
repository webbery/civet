#pragma once
#include "Table.h"
#include "lmdb/lmdb.h"

namespace caxios {
  class TableClass : public ITable {
  public:
    struct ClassProperty {

    };
  public:
    TableClass(CStorageProxy* pDatabase);
    virtual ~TableClass() {}

    virtual bool Add(const std::string& value, const std::vector<FileID>& fileid);
    virtual bool Update(const std::string& current, const UpdateValue& value);
    virtual bool Delete(const std::string& k, FileID fileID);
    virtual std::vector<FileID> Find(const std::string& k);
    bool Query(ClassID cid, ClassProperty& prop);
    bool Update(ClassID cid, const ClassProperty& prop);

  private:
    void GetClassPath(ClassID cid);
    void GetClassName(ClassID cid);
  private:
    MDB_dbi _dbi = 0;
  };
}