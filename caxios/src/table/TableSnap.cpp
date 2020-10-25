#include "Table.h"

namespace caxios {

  TableSnap::TableSnap(CDatabase* pDatabase, MDB_dbi dbi)
    : _pDatabase(pDatabase)
  {
  }

  bool TableSnap::Add(const std::string& value, FileID fileid)
  {
    return true;
  }

  bool TableSnap::Update()
  {
    return true;
  }

  bool TableSnap::Delete(const std::string& value)
  {

    return true;
  }

  bool TableSnap::Query(const std::string& k, std::vector<FileID>& filesID)
  {

    return true;
  }

}