#include "TableMeta.h"
#include "database.h"
#include <regex>
#include "log.h"
#include "util/util.h"

namespace caxios {

  TableMeta::TableMeta(CDatabase* pDatabase, const std::string& name/*, const std::string& tp*/)
    :ITable(pDatabase)
    ,_table(name)
  {
    _dbi = _pDatabase->OpenDatabase(name);
  }

  TableMeta::~TableMeta()
  {
    if (_dbi) {
      _pDatabase->CloseDatabase(_table);
      _dbi = 0;
    }
  }

  bool TableMeta::Add(const std::string& value, const std::vector<FileID>& fileid)
  {
    std::string sKey = prepareKey(value);
    // value as key, fileid as value
    void* pData = nullptr;
    uint32_t len = 0;
    _pDatabase->Get(_table, sKey, pData, len);
    std::vector<FileID> vFilesID;
    if (len) {
      vFilesID.assign((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
    }
    addUniqueDataAndSort(vFilesID, fileid);
    // T_LOG("meta", "add meta, key: %s, cur data: %s", sKey.c_str(), format_vector(vFilesID).c_str());
    return _pDatabase->Put(_table, sKey, (void*)vFilesID.data(), vFilesID.size() * sizeof(FileID));
  }

  bool TableMeta::Update(const std::string& current, const UpdateValue& value)
  {
    return true;
  }

  bool TableMeta::Delete(const std::string& k, FileID fileID)
  {
    std::string sKey = prepareKey(k);
    void* pData = nullptr;
    uint32_t len = 0;
    T_LOG("meta", "remove key: %s", sKey.c_str());
    _pDatabase->Get(_table, sKey, pData, len);
    std::vector<FileID> vFilesID;
    if (len) {
      vFilesID.assign((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
    }
    eraseData(vFilesID, fileID);
    if (vFilesID.size() == 0) {
      return _pDatabase->Del(_table, sKey);
    }
    return _pDatabase->Put(_table, sKey, (void*)vFilesID.data(), vFilesID.size() * sizeof(FileID));
  }

  std::vector<caxios::FileID> TableMeta::Find(const std::string& k)
  {
    std::vector<caxios::FileID> vFiles;
    return std::move(vFiles);
  }

  Iterator TableMeta::begin()
  {
    Iterator itr(_pDatabase, _table);
    return std::move(itr);
  }

  Iterator TableMeta::end()
  {
    return Iterator();
  }

  std::string TableMeta::prepareKey(const std::string& k)
  {
    std::string sKey(k);
    if (isDate(k)) {
      double dKey = atof(k.substr(1).c_str());
      time_t t = dKey;
      sKey = std::string((char*)&t, sizeof(time_t));
      T_LOG("meta", "Date meta key: %s", sKey.c_str());
    }
    else if (isColor(k)) {
      T_LOG("meta", "Color meta key: %s", sKey.c_str());
    }
    return sKey;
  }

  bool TableMeta::AddFileIDByInteger(const std::string& value, const std::vector<FileID>& fileID)
  {
    uint32_t key = std::stoul(value);
    return AddFileID(key, fileID);
  }

}