#include "TableMeta.h"
#include "database.h"
#include <regex>
#include "log.h"
#include "util/util.h"

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
    std::string sKey(value);
    if (isDate(value)) {
      double dKey = atof(value.substr(1).c_str());
      sKey = std::string((char*)&dKey, sizeof(double));
      T_LOG("meta", "meta key: %s", sKey.c_str());
    }
    // value做键, fileid做值
    void* pData = nullptr;
    uint32_t len = 0;
    _pDatabase->Get(_dbi, sKey, pData, len);
    std::vector<FileID> vFilesID;
    if (len) {
      vFilesID.assign((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
    }
    addUniqueDataAndSort(vFilesID, fileid);
    return _pDatabase->Put(_dbi, sKey, (void*)vFilesID.data(), vFilesID.size() * sizeof(FileID));
  }

  bool TableMeta::Update(const std::string& current, const UpdateValue& value)
  {
    return true;
  }

  bool TableMeta::Delete(const std::string& k, FileID fileID)
  {
    return true;
  }

  Iterator TableMeta::begin()
  {
    Iterator itr(_pDatabase, _dbi);
    return std::move(itr);
  }

  Iterator TableMeta::end()
  {
    return Iterator();
  }

  bool TableMeta::AddFileIDByInteger(const std::string& value, const std::vector<FileID>& fileID)
  {
    uint32_t key = std::stoul(value);
    return AddFileID(key, fileID);
  }

}