#pragma once
#include "database.h"
#include "json.hpp"
#include <map>

#define TABLE_FILEID        32    // "file_cur_id"

namespace caxios {

  class DBManager {
  public:
    DBManager(const std::string& dbdir, int flag, const std::string& meta = "");
    ~DBManager();

    std::vector<FileID> GenerateNextFilesID(int cnt = 1);
    bool AddFiles(const std::vector <std::tuple< FileID, MetaItems, Keywords >>&);
    bool GetFilesInfo(const std::vector<FileID>& filesID, std::vector< FileInfo>& filesInfo);
    bool GetFilesSnap(std::vector< Snap >& snaps);
    bool FindFiles(const nlohmann::json& query, std::vector< FileInfo>& filesInfo);

  private:
    bool AddFile(FileID, const MetaItems&, const Keywords&);
    bool GetFileInfo(FileID fileID, MetaItems& meta, Keywords& keywords, Tags& tags, Annotations& anno);
    void ParseMeta(const std::string& meta);
    MDB_dbi GetMetaDB(const std::string& name);

  private:
    DBFlag _flag = ReadWrite;
    CDatabase* m_pDatabase = nullptr;
    std::map<std::string, MDB_dbi > m_mDBs;
    std::map<std::string, MDB_dbi > m_mMetaDBs; // 元信息查询表
    std::map<std::string, std::string> m_mSchema; // <name, value>
  };
}