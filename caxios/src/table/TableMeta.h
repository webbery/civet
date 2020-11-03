#pragma once
#include "Table.h"
#include "lmdb/lmdb.h"
#include "Value.h"
#include <string.h>

namespace caxios {

  class TableMeta : public ITable {
  public:
    TableMeta(CDatabase* pDatabase, const std::string& name, const std::string& stp);
    virtual ~TableMeta();

    virtual bool Add(const std::string& value, const std::vector<FileID>& fileid);
    virtual bool Update();
    virtual bool Delete(const std::string& k, FileID fileID);
    virtual bool Query(const std::string& k, std::vector<FileID>& filesID);

  private:
    bool AddFileIDByInteger(const std::string& value, const std::vector<FileID>& fileID);

    template<typename T>
    bool AddFileID(const T& key, const std::vector<FileID>& fileID) {
      void* pFilesID = nullptr;
      uint32_t len = 0;
      _pDatabase->Get(_dbi, key, pFilesID, len);
      if (len == 0) {
        if (!_pDatabase->Put(_dbi, key, (void*)&(fileID[0]), fileID.size()*sizeof(uint32_t))) {
          return false;
        }
      }
      else {
        const int val = len + fileID.size() * sizeof(FileID);
        FileID* filesID = (FileID*)malloc(val);
        if (filesID == nullptr) return false;
        memcpy(filesID, pFilesID, len);
        memcpy(filesID + len, &(fileID[0]), fileID.size() * sizeof(FileID));
        if (!_pDatabase->Put(_dbi, key, (void*)filesID, val)) {
          free(filesID);
          return false;
        }
        free(filesID);
      }
      return true;
    }
  private:
    MDB_dbi _dbi = 0;
    std::string _table;
    ValueType _type = VTUnkwon;
  };
}