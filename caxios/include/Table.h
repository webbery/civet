#pragma once 
#include <string>
#include <variant>
#include "datum_type.h"

#define TABLE_SCHEMA        "dbinfo"
#define TABLE_FILESNAP      "file_snap"
#define TABLE_FILE_META     "file_meta"
#define TABLE_KEYWORD_INDX  "keyword2indx"
#define TABLE_INDX_KEYWORD  "indx2keyword"
#define TABLE_KEYWORD2FILE  "keyword2file"
#define TABLE_FILE2KEYWORD  "file2keyword"
#define TABLE_FILE2TAG      "tag"           // fileID -> tag
#define TABLE_TAG2FILE      "tags"          // tag -> fileID
#define TABLE_TAG_INDX      "tag_indx"      // alphabet -> tag indx
#define TABLE_CLASS2HASH    "class2hash"    // class -> hash, so that when class name change, hash can not be change
#define TABLE_HASH2CLASS    "hash2class"    // hash -> class
#define TABLE_FILE2CLASS    "class"         // fileID -> class hash
#define TABLE_CLASS2FILE    "classes"       // class hash -> fileID
#define TABLE_COUNT         "count"         // about count of some statistic
#define TABLE_ANNOTATION    "annotation"
#define TABLE_MATCH_META    "match_meta"
#define TABLE_MATCH         "match_t"
#define TABLE_RECYCLE_ID    "recycle"

#define SCHEMA_VERSION    1

namespace caxios {
  class CDatabase;

  enum CountType {
    CT_UNCALSSIFY = 1
  };

  class Date {
  public:
    Date(double value)
    :_value(value){}

    Date(const std::string& s)
    :_value(0){
      size_t where = s.find("date(");
      if (where != std::string::npos) {
        _value = atof(s.substr(5, s.size() - 6).c_str());
      }
    }

    std::string toString() {
      return std::string("date(") + std::to_string(_value) + ")";
    }

    std::string toLocalString() {
      std::string lcs;
      return std::move(lcs);
    }
    double Value() { return _value; }
  private:
    double _value;
  };

  typedef std::string ClassName;
  typedef std::vector<FileID> ChildrenFile;
  typedef std::vector<ClassName> ChildrenClass;
  typedef std::variant<ClassName, ChildrenFile, ChildrenClass> UpdateValue;
  class ITable {
  public:
    //std::string Name() { return _table; }
    ITable(CDatabase* pDB) :  _pDatabase(pDB) {}
    virtual ~ITable() {}

    virtual bool Add(const std::string& value, const std::vector<FileID>& fileid) = 0;
    virtual bool Update(const std::string& current, const UpdateValue& value) = 0;
    virtual bool Delete(const std::string& k, FileID fileID) = 0;
    virtual bool Query(const std::string& k, std::vector<FileID>& filesID, std::vector<std::string>& vChildren) = 0;
  protected:
    CDatabase* _pDatabase = nullptr;
  };
}
