#include "TableClass.h"

namespace caxios {
  namespace {
    const char* g_class_tables[] = {
      TABLE_HASH2CLASS,
      TABLE_CLASS2HASH,
      TABLE_FILE2CLASS,
      TABLE_CLASS2FILE,
    };
  }
  TableClass::TableClass(CDatabase* pDatabase)
    :ITable(pDatabase)
  {

  }

  bool TableClass::Add(const std::string& value, const std::vector<FileID>& fileid)
  {
    if (fileid.size()) {
    }
    else {
    }
    return true;
  }

  bool TableClass::Update(const std::string& current, const UpdateValue& value)
  {
    return true;
  }

  bool TableClass::Update(ClassID cid, const ClassProperty& prop)
  {
    return true;
  }

  bool TableClass::Delete(const std::string& k, FileID fileID)
  {
    return true;
  }

  std::vector<caxios::FileID> TableClass::Find(const std::string& k)
  {
    std::vector<caxios::FileID> vFiles;
    return std::move(vFiles);
  }

  bool TableClass::Query(ClassID cid, ClassProperty& prop)
  {
    return true;
  }

  void TableClass::GetClassName(ClassID cid)
  {

  }

}