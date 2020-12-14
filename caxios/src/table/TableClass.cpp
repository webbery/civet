#include "TableClass.h"

namespace caxios {

  TableClass::TableClass(CDatabase* pDatabase, const std::string& name)
    :ITable(pDatabase)
  {

  }

  bool TableClass::Add(const std::string& value, const std::vector<FileID>& fileid)
  {
    return true;
  }

  bool TableClass::Update(const std::string& current, const UpdateValue& value)
  {
    return true;
  }
  bool TableClass::Delete(const std::string& k, FileID fileID)
  {
    return true;
  }
  bool TableClass::Query(const std::string& k, std::vector<FileID>& filesID)
  {
    return true;
  }

}