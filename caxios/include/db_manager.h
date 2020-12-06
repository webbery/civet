#pragma once
#include "database.h"
#include "json.hpp"
#include <map>
#include <Table.h>
#include "log.h"

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
    bool RemoveTags(const std::vector<FileID>& files, const Tags& tags);
    bool SetTags(const std::vector<FileID>& filesID, const std::vector<std::string>& tags);
    bool GetFilesInfo(const std::vector<FileID>& filesID, std::vector< FileInfo>& filesInfo);
    bool GetFilesSnap(std::vector< Snap >& snaps);
    bool GetUntagFiles(std::vector<FileID>& filesID);
    bool GetUnClassifyFiles(std::vector<FileID>& filesID);
    bool GetTagsOfFiles(const std::vector<FileID>& filesID, std::vector<Tags>& tags);
    bool GetAllClasses(nlohmann::json& classes);
    bool GetAllTags(TagTable& tags);
    bool UpdateFilesClasses(const std::vector<FileID>& filesID, const std::vector<std::string>& classes);
    bool UpdateClassName(const std::string& oldName, const std::string& newName);
    bool Query(const std::string& query, std::vector< FileInfo>& filesInfo);

  public: // will be implimented in ITable
    bool QueryKeyword(const std::string& tableName, const std::string& value, std::vector<FileID>& outFilesID);

  private:
    void ValidVersion();
    bool AddFile(FileID, const MetaItems&, const Keywords&);
    bool AddFileID2Tag(const std::vector<FileID>&, WordIndex);
    bool AddFileID2Keyword(FileID, WordIndex);
    bool AddKeyword2File(WordIndex, FileID);
    bool AddTagPY(const std::string& tag, WordIndex indx);
    bool AddFileID2Class(const std::vector<FileID>& vFilesID, const std::string&);
    bool RemoveFile(FileID);
    bool RemoveTag(FileID, const Tags& tags);
    bool GetFileInfo(FileID fileID, MetaItems& meta, Keywords& keywords, Tags& tags, Annotations& anno);
    bool GetFileTags(FileID fileID, Tags& tags);
    std::vector<FileID> GetFilesByClass(const std::vector<WordIndex>& clazz);
    bool IsFileExist(FileID fileID);
    bool IsClassExist(const std::string& clazz);
    uint32_t GenerateClassHash(const std::vector<WordIndex>& clazz);
    uint32_t GetClassHash(const std::string& clazz);
    std::vector<FileID> mapExistFiles(const std::vector<FileID>&);
    void ParseMeta(const std::string& meta);
    void UpdateCount1(CountType ct, int cnt);
    void SetSnapStep(FileID fileID, int bit);
    char GetSnapStep(FileID fileID, nlohmann::json&);
    std::map<std::string, WordIndex> GetWordsIndex(const std::vector<std::string>& words);
    std::vector<std::string> GetWordByIndex(const WordIndex* const wordsIndx, size_t cnt);
    template<typename Itr>
    std::map<WordIndex, std::string> GetWordByIndex(const Itr start, const Itr end) {
      std::map<WordIndex, std::string> mWords;
      for (Itr itr = start; itr != end; ++itr)
      {
        WordIndex index = *itr;
        if (index == 0) {
          T_LOG("dict", "word index: 0");
          continue;
        }
        void* pData = nullptr;
        uint32_t len = 0;
        if (!m_pDatabase->Get(m_mDBs[TABLE_INDX_KEYWORD], index, pData, len)) continue;
        std::string word((char*)pData, len);
        mWords[index] = word;
      }
      return std::move(mWords);
    }
    std::vector<std::vector<FileID>> GetFilesIDByTagIndex(const WordIndex* const wordsIndx, size_t cnt);

  private:
    DBFlag _flag = ReadWrite;
    CDatabase* m_pDatabase = nullptr;
    std::map<std::string, MDB_dbi > m_mDBs;
    std::map<std::string, ITable*> m_mTables;
  };
}