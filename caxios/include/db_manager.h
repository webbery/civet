#ifndef _CAXIOS_DB_MANAGER_H_
#define _CAXIOS_DB_MANAGER_H_
#include "database.h"
#include "json.hpp"
#include <map>
#include <Table.h>
#include "log.h"
#include "datum_type.h"

#define TABLE_FILEID        32    // "file_cur_id"

#define TB_Keyword    "keyword"
#define TB_Tag        "tag"
#define TB_Class      "class"
#define TB_Annotation "annotation"
#define TB_FileID     "fileid"

namespace caxios {
    enum CompareType {
    CT_EQUAL = 0,
    CT_IN,
    CT_OR,
    CT_GREAT_EQUAL,
    CT_GREAT_THAN,
    CT_LESS_THAN
  };

  enum QueryType {
    QT_String,
    QT_DateTime,
  };
  template<QueryType Q, CompareType C> struct CQuery;
  template<> struct CQuery<QT_String, CT_IN>;
  template<typename Q> struct CQueryType {
    static Q policy(MDB_val& val) {
      return *(Q*)val.mv_data;
    }
  };

  class QueryCondition {
  public:
    QueryCondition();
    QueryCondition(const std::string& s);
    QueryCondition(time_t s);

    template <typename T>
    T As() const {
      return std::get<T>(m_sCondition);
    }

    QueryType type() const {return m_qType;}
  private:
    QueryType m_qType;
    std::variant< std::string, time_t, double> m_sCondition;
  };

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

  public: // will be implimented in ITable
    template<typename F>
    std::vector<FileID> QueryImpl(const std::string& keyword, const F& compare)
    {
      std::vector<FileID> vOut;
      auto itr = m_mTables.find(keyword);
      if (itr != m_mTables.end()) {
        T_LOG("query", "meta(%s)", keyword.c_str());
        // meta
        auto cursor = std::begin(*(itr->second));
        auto end = Iterator();
        for (; cursor != end; ++cursor) {
          auto item = *cursor;
          typename F::type val = CQueryType<typename F::type>::policy(item.first);
          if (compare(val)) {
            FileID* start = (FileID*)(item.second.mv_data);
            vOut.insert(vOut.end(), start, start + item.second.mv_size / sizeof(FileID));
          }
        }
      }
      else {
        if (keyword == TB_Keyword || keyword == TB_Class || keyword == TB_Tag) {
          return this->_Query(m_mKeywordMap[keyword], compare);
        }
        T_LOG("query", "keyword %s", keyword.c_str());
        //if (subset.empty()) {
        //  
        //}
        //else {
        //}
      }
      return vOut;
    }

  private:
    void ValidVersion();
    void InitMap();
    bool AddFile(FileID, const MetaItems&, const Keywords&);
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
    std::map<std::string, WordIndex> GetWordsIndex(const std::vector<std::string>& words);
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
        if (!m_pDatabase->Get(m_mDBs[TABLE_INDX_KEYWORD], word_policy<T>::id(index), pData, len)) continue;
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
        if (!m_pDatabase->Get(m_mDBs[TABLE_INDX_KEYWORD], index, pData, len)) continue;
        std::string word((char*)pData, len);
        mWords[index] = word;
      }
      return std::move(mWords);
    }
    std::vector<std::vector<FileID>> GetFilesIDByTagIndex(const WordIndex* const wordsIndx, size_t cnt);

  private:
    std::vector<FileID> _Query(const std::string& tableName, const CQuery<QT_String, CT_IN>& values);
    std::vector<FileID> _Query(const std::string& tableName, const CQuery<QT_String, CT_EQUAL>& values);
    template<typename FAIL>
    std::vector<FileID> _Query(const std::string& tableName, FAIL& values) {
#ifdef WIN32
      T_LOG("query", "fail, table: %s, query: %s", tableName.c_str()
        , typeid(values).name()
      );
#endif
      std::vector<FileID> v;
      return std::move(v);
    }
    std::vector<FileID> _QueryImpl(const std::string& tableName, const std::map<std::string, caxios::WordIndex>& wIndexes);

  private:
    DBFlag _flag = ReadWrite;
    CDatabase* m_pDatabase = nullptr;
    std::map<std::string, MDB_dbi > m_mDBs;
    std::map<std::string, std::string> m_mKeywordMap;
    std::map<std::string, ITable*> m_mTables;
  };

  class IAction {
  public:
    virtual ~IAction() {}
    //virtual void push(const std::string& kw) = 0;
    //virtual void push(const QueryCondition& cond) = 0;
    virtual std::vector<FileID> query(DBManager*) = 0;
  };

  template<QueryType QT, CompareType CT>
  class QueryAction : public IAction {
  public:
    QueryAction(const std::string& k, const std::vector<QueryCondition>& vCond)
    :m_sKeyword(k)
    , m_query(vCond)
    { }

    std::vector<FileID> query(DBManager* pDB) {
      return pDB->QueryImpl(m_sKeyword, m_query/*, m_vQuerySet*/);
    }

    void constraint(const std::vector<FileID>&);

  private:
    std::string m_sKeyword;
    CQuery< QT, CT > m_query;
    std::vector<FileID> m_vQuerySet;
  };
  
}

#endif
