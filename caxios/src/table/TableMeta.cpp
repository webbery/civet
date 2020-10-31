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
    if (tp == "str") {
      _type = VTString;
    }
    else if (tp == "int") {
      _type = VTInteger;
    }
    else if (tp == "dec") {
      _type = VTDecimal;
    }
    else if (tp == "date") {
      _type = VTDate;
    }
    else if (tp == "hash") {
      _type = VTHash;
    }
    else if (tp == "color") {
      _type = VTColor;
    }
    else {
      _type = VTUnkwon;
    }
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
    T_LOG("Add Key: %s, files: %s", value.c_str(), sID.c_str());
#endif
    // 分辨value的类型,确定key的真正类型
    std::regex integer("[0-9]+"), color("#[0-9A-Fa-f]{6}"), decimal("[0-9]+.[0-9]+");
    ValueType vt = VTUnkwon;
    if (std::regex_search(value, integer)) { // RGB色彩
      vt = VTColor;
    }
    else if (std::regex_search(value, color)) { // 整形数字
      vt = VTInteger;
    }
    else if (std::regex_search(value, decimal)) // 浮点数
    {
      vt = VTDecimal;
    }
    else { // 普通字符串
      vt = VTString;
    }
    if (vt != _type) return false;
    switch (_type)
    {
    case caxios::VTString:
      return AddFileID(value, fileid);
    case caxios::VTInteger:
      return AddFileIDByInteger(value, fileid);
    case caxios::VTDecimal:
      break;
    case caxios::VTDate:
      break;
    case caxios::VTColor:
      break;
    case caxios::VTHash:
      break;
    default:
      return false;
    }
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
    switch (_type)
    {
    case caxios::VTString:
      _pDatabase->Get(_dbi, k, pData, len);
      break;
    case caxios::VTInteger:
    {
      uint32_t key = std::stoul(k);
      _pDatabase->Get(_dbi, key, pData, len);
    }
      break;
    case caxios::VTDecimal:
      break;
    case caxios::VTDate:
      break;
    case caxios::VTColor:
      break;
    case caxios::VTHash:
      break;
    default:
      return false;
    }
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