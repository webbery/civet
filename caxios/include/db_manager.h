#pragma once
#include "database.h"
#include "json.hpp"
#include <map>
#include "QueryParser.h"
#include <Table.h>

#define TABLE_FILEID        32    // "file_cur_id"

namespace caxios {

  class DBManager {
  public:
    DBManager(const std::string& dbdir, int flag, const std::string& meta = "");
    ~DBManager();

    std::vector<FileID> GenerateNextFilesID(int cnt = 1);
    bool AddFiles(const std::vector <std::tuple< FileID, MetaItems, Keywords >>&);
    bool AddClasses(const std::vector<std::string>& classes);
    bool AddClasses(const std::vector<std::string>& classes, const std::vector<FileID>& filesID);
    bool RemoveFiles(const std::vector<FileID>& filesID);
    bool SetTags(const std::vector<FileID>& filesID, const std::vector<std::string>& tags);
    bool GetFilesInfo(const std::vector<FileID>& filesID, std::vector< FileInfo>& filesInfo);
    bool GetFilesSnap(std::vector< Snap >& snaps);
    bool GetUntagFiles(std::vector<FileID>& filesID);
    bool GetUnClassifyFiles(std::vector<FileID>& filesID);
    bool GetTagsOfFiles(const std::vector<FileID>& filesID, std::vector<Tags>& tags);
    bool GetAllClasses(Classes& classes);
    bool GetAllTags(TagTable& tags);
    bool UpdateFilesClasses(const std::vector<FileID>& filesID, const std::vector<std::string>& classes);
    bool FindFiles(const nlohmann::json& query, std::vector< FileInfo>& filesInfo);

  private:
    bool AddFile(FileID, const MetaItems&, const Keywords&);
    bool AddFileID2Tag(const std::vector<FileID>&, WordIndex);
    bool AddTagPY(const std::string& tag, WordIndex indx);
    bool AddFileID2Class(const std::vector<FileID>& vFilesID, WordIndex index);
    bool RemoveFile(FileID);
    bool GetFileInfo(FileID fileID, MetaItems& meta, Keywords& keywords, Tags& tags, Annotations& anno);
    bool GetFileTags(FileID fileID, Tags& tags);
    void ParseMeta(const std::string& meta);
    void UpdateCount1(CountType ct, int cnt);
    void SetSnapStep(FileID fileID, int offset);
    char GetSnapStep(FileID fileID, nlohmann::json&);
    std::map<std::string, WordIndex> GetWordsIndex(const std::vector<std::string>& words);
    std::vector<std::string> GetWordByIndex(const WordIndex* const wordsIndx, size_t cnt);
    std::vector<std::vector<FileID>> GetFilesIDByTagIndex(const WordIndex* const wordsIndx, size_t cnt);

  private:
    DBFlag _flag = ReadWrite;
    CDatabase* m_pDatabase = nullptr;
    QueryParser m_qParser;
    std::map<std::string, MDB_dbi > m_mDBs;
    std::map<std::string, ITable*> m_mTables;
  };
}