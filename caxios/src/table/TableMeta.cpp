#include "TableMeta.h"
#include "database.h"
#include <regex>
#include "log.h"

namespace caxios {

  TableMeta::TableMeta(CDatabase* pDatabase, const std::string& name, const std::string& tp)
    :ITable(pDatabase)
    ,_table(name)
  {
    _dbi = _pDatabase->OpenDatabase(name);
  }

  TableMeta::~TableMeta()
  {
    if (_dbi) {
      _pDatabase->CloseDatabase(_dbi);
      _dbi = 0;
    }
  }

  bool TableMeta::Add(const std::string& value, const std::vector<FileID>& fileid)
  {
    // value做键, fileid做值
#ifdef _DEBUG
    std::string sID;
    for (auto item: fileid)
    {
      sID += std::to_string(item) + ",";
    }
    T_LOG("meta", "Add Key: %s, files: %s", value.c_str(), sID.c_str());
#endif
    // 分辨value的类型,确定key的真正类型
    std::regex integer("[0-9]+"), color("#[0-9A-Fa-f]{6}"), decimal("[0-9]+.[0-9]+");
    return true;
  }

  bool TableMeta::Update()
  {
    return true;
  }

  bool TableMeta::Delete(const std::string& k, FileID fileID)
  {
    return true;
  }

  bool TableMeta::Query(const std::string& k, std::vector<FileID>& filesID)
  {
    // 等于语义
    void* pData = nullptr;
    uint32_t len = 0;
    if (len > 0) {
      for (int idx = 0; idx < len / sizeof(FileID); ++idx) {
        filesID.emplace_back(((FileID*)pData)[idx]);
      }
      return true;
    }
    return false;
  }

  bool TableMeta::AddFileIDByInteger(const std::string& value, const std::vector<FileID>& fileID)
  {
    uint32_t key = std::stoul(value);
    return AddFileID(key, fileID);
  }

}