#ifndef _CAXIOS_DB_MANAGER_H_
#define _CAXIOS_DB_MANAGER_H_
#include "json.hpp"
#include <map>
#include "log.h"
#include "datum_type.h"
#include "CompareType.h"
#include "Keyword.h"
#include "Condition.h"
#include "Table.h"

#define TABLE_FILEID        32    // "file_cur_id"

namespace caxios {
  template<DataType Q, CompareType C> struct CQuery;
  template<> struct CQuery<QT_String, CT_IN>;
  template<> struct CQuery<QT_Color, CT_EQUAL>;

  class CStorageProxy;

  class DBManager {
  public:
    DBManager(const std::string& dbdir, int flag, const std::string& meta = "");
    ~DBManager();

    std::vector<FileID> GenerateNextFilesID(int cnt = 1);
    bool AddFiles(const std::vector <std::tuple< FileID, MetaItems, Keywords >>&);
    bool AddClasses(const std::vector<std::string>& classes);
    bool AddClasses(const std::vector<std::string>& classes, const std::vector<FileID>& filesID);
    bool AddMeta(const std::vector<FileID>& files, const nlohmann::json& meta);
    bool RemoveFiles(const std::vector<FileID>& filesID);
    bool RemoveTags(const std::vector<FileID>& files, const Tags& tags);
    bool RemoveClasses(const std::vector<std::string>& classes);
    bool RemoveClasses(const std::vector<std::string>& classes, const std::vector<FileID>& filesID);
    bool SetTags(const std::vector<FileID>& filesID, const std::vector<std::string>& tags);
    bool GetFilesInfo(const std::vector<FileID>& filesID, std::vector< FileInfo>& filesInfo);
    bool GetFilesSnap(std::vector< Snap >& snaps);
    size_t GetFileCountOfClass(ClassID cid);
    size_t GetAllFileCountOfClass(ClassID cid);
    bool GetUntagFiles(std::vector<FileID>& filesID);
    bool GetUnClassifyFiles(std::vector<FileID>& filesID);
    bool GetTagsOfFiles(const std::vector<FileID>& filesID, std::vector<Tags>& tags);
    bool GetClasses(const std::string& parent, nlohmann::json& classes);
    bool getClassesInfo(const std::string& classPath, nlohmann::json& clsInfo);
    bool GetAllTags(TagTable& tags);
    bool UpdateFilesClasses(const std::vector<FileID>& filesID, const std::vector<std::string>& classes);
    bool UpdateClassName(const std::string& oldName, const std::string& newName);
    bool UpdateFileMeta(const std::vector<FileID>& filesID, const nlohmann::json& mutation);
    bool Query(const std::string& query, std::vector< FileInfo>& filesInfo);

  private:
    void InitDB(CStorageProxy*& pDB, const char* dir, const char* name, size_t size);
    void InitMap();
    void TryUpdate();
    bool AddFile(FileID, const MetaItems&, const Keywords&);
    //bool AddBinMeta(FileID, )
    bool AddFileID2Tag(const std::vector<FileID>&, WordIndex);
    bool AddFileID2Keyword(FileID, WordIndex);
    void UpdateChildrenClassName(
      const std::string& clssKey, const std::string& oldarentName, const std::string& newParentName,
      const std::vector<std::string>& oldStrings, const std::vector<WordIndex>& vWordsIndex);
    bool AddKeyword2File(WordIndex, FileID);
    void BindKeywordAndFile(WordIndex, FileID);
    void BindKeywordAndFile(const std::vector<WordIndex>&, const std::vector<FileID>&);
    bool AddTagPY(const std::string& tag, WordIndex indx);
    bool AddClass2FileID(uint32_t, const std::vector<FileID>& vFilesID);
    bool AddFileID2Class(const std::vector<FileID>&, uint32_t);
    void MapHash2Class(uint32_t clsID, const std::string& name);
    std::vector<uint32_t> AddClassImpl(const std::vector<std::string>& classes);
    void InitClass(const std::string& key, uint32_t curClass, uint32_t parent);
    bool RemoveFile(FileID);
    void RemoveFile(FileID, const std::string& file2type, const std::string& type2file);
    bool RemoveTag(FileID, const Tags& tags);
    bool RemoveClassImpl(const std::string& classPath);
    bool RemoveKeywords(const std::vector<FileID>& filesID, const std::vector<std::string>& keyword);
    bool RemoveFileIDFromKeyword(FileID fileID);
    bool GetFileInfo(FileID fileID, MetaItems& meta, Keywords& keywords, Tags& tags, Annotations& anno);
    bool GetFileTags(FileID fileID, Tags& tags);
    std::vector<FileID> GetFilesByClass(const std::vector<WordIndex>& clazz);
    bool IsFileExist(FileID fileID);
    bool IsClassExist(const std::string& clazz);
    uint32_t GenerateClassHash(const std::string& clazz);
    uint32_t GetClassHash(const std::string& clazz);
    uint32_t GetClassParent(const std::string& clazz);
    std::pair<uint32_t, std::string> EncodePath2Hash(const std::string& classPath);
    std::vector<ClassID> GetClassChildren(const std::string& clazz);
    std::string GetClassByHash(ClassID);
    std::string GetClassKey(ClassID);
    std::string GetClassKey(const std::string& clsPath);
    std::vector<FileID> GetFilesOfClass(uint32_t clsID);
    std::vector<FileID> mapExistFiles(const std::vector<FileID>&);
    void ParseMeta(const std::string& meta);
    void SetSnapStep(FileID fileID, int bit, bool set=true);
    char GetSnapStep(FileID fileID, nlohmann::json&);
    Snap GetFileSnap(FileID);
    WordIndex GetWordIndex(const std::string& word);

    template<typename T>
    std::vector<std::string> GetWordByIndex(const T* const wordsIndx, size_t cnt) {
      std::vector<std::string> vWords(cnt);
      for (size_t idx = 0; idx < cnt; ++idx)
      {
        const T& index = wordsIndx[idx];
        if (word_policy<T>::id(index) == 0) {
          T_LOG("dict", "word index: 0");
          continue;
        }
        void* pData = nullptr;
        uint32_t len = 0;
        if (!m_pDatabase->Get(TABLE_INDX_KEYWORD, word_policy<T>::id(index), pData, len)) continue;
        std::string word((char*)pData, len);
        vWords[idx] = word;
      }
      return std::move(vWords);
    }
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
        if (!m_pDatabase->Get(TABLE_INDX_KEYWORD, index, pData, len)) continue;
        std::string word((char*)pData, len);
        mWords[index] = word;
      }
      return std::move(mWords);
    }
    std::vector<std::vector<FileID>> GetFilesIDByTagIndex(const WordIndex* const wordsIndx, size_t cnt);

  private:
    DBFlag _flag = ReadWrite;
    CStorageProxy* m_pDatabase = nullptr;
  };
  
}

#endif
