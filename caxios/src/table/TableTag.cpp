#include "TableTag.h"
#include "lmdb/lmdb.h"
#include "database.h"

namespace caxios {
  namespace {
    const char* g_tag_table[] = {
      TABLE_FILE2TAG,
      TABLE_TAG2FILE,
      TABLE_TAG_INDX
    };
  }
  TableTag::TableTag(CDatabase* pDatabase)
    :ITable(pDatabase)
  {
    int cnt = sizeof(g_tag_table) / sizeof(char*);
    for (int idx = 0; idx < cnt; ++idx) {
      MDB_dbi dbi = _pDatabase->OpenDatabase(g_tag_table[idx]);
      if (dbi >= 0) {
        _dbi[g_tag_table[idx]] = dbi;
      }
    }
  }

  TableTag::~TableTag()
  {
    for (auto item : _dbi) {
      _pDatabase->CloseDatabase(item.second);
    }
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

  std::vector<caxios::FileID> TableTag::Find(const std::string& k)
  {
    std::vector<caxios::FileID> vFiles;
    return std::move(vFiles);
  }

  Iterator TableTag::begin()
  {
    return Iterator();
  }

  Iterator TableTag::end()
  {
    return Iterator();
  }

}