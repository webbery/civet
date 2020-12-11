#include "TableTag.h"
#include "lmdb/lmdb.h"
#include "database.h"

namespace caxios {

  TableTag::TableTag(CDatabase* pDatabase, const std::string& name)
    :ITable(pDatabase)
  {
    _dbi = _pDatabase->OpenDatabase(name);
  }

  bool TableTag::Add(const std::string& value, const std::vector<FileID>& fileid)
  {
    return true;
  }

  bool TableTag::Update(const std::string& current, const UpdateValue& value)
  {
    return true;
  }

  bool TableTag::Delete(const std::string& k, FileID fileID)
  {

    return true;
  }

  bool TableTag::Query(const std::string& k, std::vector<FileID>& filesID, std::vector<std::string>& vChildren)
  {

    return true;
  }

}