#include "upgrader.h"

#define UPGRADE(from, to) case from: Upgrader<from, to>::upgrade(pUpgrade)

namespace caxios{

  bool upgrade(CStorageProxy* pUpgrade, int from, int to)
  {
    pUpgrade->Begin();
    switch (from)
    {
      UPGRADE(1, 2);
    default:
      break;
    }
    char dbvs = SCHEMA_VERSION;
    pUpgrade->Put(TABLE_SCHEMA, (uint32_t)SCHEMA_INFO::Version, (void*)&dbvs, sizeof(char));
    pUpgrade->Commit();
    return true;
  }

}