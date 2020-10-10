#pragma once
#include "database.h"
#include <map>

#define TABLE_FILEID        32    // "file_cur_id"

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

  class DBManager {
  public:
    DBManager(const std::string& dbdir, int flag);
    ~DBManager();

    //std::vector<std::string> GetAllDBInstance();
    //bool SwitchDBInstance(const std::string& instance);

    std::vector<FileID> GenerateNextFilesID(int cnt = 1);
    bool AddFiles(const std::vector <std::tuple< FileID, MetaItems, Keywords >>&);
    bool GetFilesInfo(MetaItems& meta, Keywords& keywords, FileID* filesID, int file_num = 1);
    bool GetFilesSnap(std::vector< Snap >& snaps);
    bool FindByValue();

  private:
    bool AddFile(FileID, const MetaItems&, const Keywords&);
    bool GetFileInfo(FileID fileID, MetaItems& meta, Keywords& keywords, Tags& tags, Annotations& anno);

  private:
    DBFlag _flag = ReadWrite;
    CDatabase* m_pDatabase = nullptr;
    std::map<std::string, MDB_dbi > m_mDBs;
  };
}