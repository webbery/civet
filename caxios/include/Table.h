#pragma once 
#include <string>
#include <variant>
#include "datum_type.h"
#include "database.h"
#include <string.h>

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

  class Iterator {
  public:
    Iterator() {
      _refs = new int(0);
    }
    Iterator(const Iterator& other)
      :_refs(other._refs)
      , _pDatabase(other._pDatabase)
      ,_end(other._end)
      ,_key(other._key)
      ,_datum(other._datum)
      ,_cursor(other._cursor)
    {
      *_refs += 1;
    }
    Iterator(CDatabase* pDatabase, MDB_dbi dbi)
      :_end(false)
      , _pDatabase(pDatabase)
    {
      _refs = new int(1);
      _cursor = pDatabase->OpenCursor(dbi);
      pDatabase->MoveNext(_cursor, _key, _datum);
    }
    ~Iterator(){
      *_refs -= 1;
      if (*_refs == 0 && _pDatabase) {
        _pDatabase->CloseCursor(_cursor);
        delete _refs;
      }
    }
    
    Iterator& operator++() {
      if (_pDatabase->MoveNext(_cursor, _key, _datum)) {
        _end = true;
      }
      return *this;
    }

    std::pair< MDB_val, MDB_val> operator*() {
      return std::make_pair(_key, _datum);
    }

    bool operator == (const Iterator& other) {
      if (!_end) {
        if (_key.mv_size != other._key.mv_size) return false;
        if (memcmp(_key.mv_data, other._key.mv_data, _key.mv_size) == 0) return true;
        return false;
      }
      return true;
    }
    bool operator!=(const Iterator& other) {
      return !this->operator==(other);
    }
  private:
    bool _end = true;
    int* _refs = nullptr;
    MDB_val _key;
    MDB_val _datum;
    CDatabase* _pDatabase = nullptr;
    MDB_cursor* _cursor = nullptr;
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
    virtual Iterator begin() = 0;
    virtual Iterator end() = 0;
  protected:
    CDatabase* _pDatabase = nullptr;
  };
}
