#include "Table.h"

namespace caxios {

  TableSnap::TableSnap(CDatabase* pDatabase, MDB_dbi dbi)
    :_table(TABLE_FILESNAP)
    , _dbi(dbi)
    , _pDatabase(pDatabase)
  {
  }

  bool TableSnap::Add()
  {
    return true;
  }

  bool TableSnap::Update()
  {
    return true;
  }

  bool TableSnap::Delete()
  {

    return true;
  }

  bool TableSnap::Query()
  {

    return true;
  }

}