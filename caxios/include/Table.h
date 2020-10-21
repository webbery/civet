#pragma once 
#include <string>

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

namespace caxios {
  class ITable {
  public:
    std::string Name() { return _table; }
    virtual ~ITable() {}

    virtual bool Add() = 0;
    virtual bool Update() = 0;
    virtual bool Delete() = 0;
    virtual bool Query() = 0;
  protected:
    static std::string _table;
  };
}
