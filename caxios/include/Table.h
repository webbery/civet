#pragma once 
#include <string>
#include "datum_type.h"

#define TABLE_META          "dbinfo"
#define TABLE_FILESNAP      "file_snap"
#define TABLE_FILE_META     "file_meta"
#define TABLE_KEYWORD_INDX  "keyword2indx"
#define TABLE_INDX_KEYWORD  "indx2keyword"
#define TABLE_TAG           "tag"
#define TABLE_CLASS         "class"
#define TABLE_ANNOTATION    "annotation"
#define TABLE_MATCH_META    "match_meta"
#define TABLE_MATCH         "match_t"
#define TABLE_RECYCLE_ID    "recycle"

namespace caxios {
  class CDatabase;
  class ITable {
  public:
    //std::string Name() { return _table; }
    ITable(CDatabase* pDB) :  _pDatabase(pDB) {}
    virtual ~ITable() {}

    virtual bool Add(const std::string& value, const std::vector<FileID>& fileid) = 0;
    virtual bool Update() = 0;
    virtual bool Delete(const std::string& k, FileID fileID) = 0;
    virtual bool Query(const std::string& k, std::vector<FileID>& filesID) = 0;
  protected:
    CDatabase* _pDatabase = nullptr;
  };
}
