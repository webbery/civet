#include "db_manager.h"
#include <iostream>
#include "log.h"
#include "util/util.h"
#include "table/TableMeta.h"

#define CHECK_DB_OPEN(dbname) \
  if (m_mDBs[dbname] == -1) {\
    m_mDBs[dbname] = m_pDatabase->OpenDatabase(dbname);\
    T_LOG("OpenDatabase: %s, DBI: %d", dbname, m_mDBs[dbname]);\
    if (m_mDBs[dbname] == -1) return false;\
  }

namespace caxios {
  const char* g_tables[] = {
    TABLE_FILESNAP,
    TABLE_FILE_META,
    TABLE_KEYWORD_INDX,
    TABLE_INDX_KEYWORD,
    TABLE_TAG,
    TABLE_CLASS,
    TABLE_ANNOTATION,
    TABLE_MATCH_META,
    TABLE_MATCH
  };

  DBManager::DBManager(const std::string& dbdir, int flag, const std::string& meta/* = ""*/)
  {
    _flag = (flag == 0 ? ReadWrite : ReadOnly);
    if (m_pDatabase == nullptr) {
      m_pDatabase = new CDatabase(dbdir, _flag);
    }
    if (m_pDatabase == nullptr) {
      std::cerr << "new CDatabase fail.\n";
      return;
    }
    // open all database
    int cnt = sizeof(g_tables) / sizeof(char*);
    for (int idx = 0; idx < cnt; ++idx) {
      MDB_dbi dbi = m_pDatabase->OpenDatabase(g_tables[idx]);
      if (dbi >= 0) {
        m_mDBs[g_tables[idx]] = dbi;
      }
    }
    if (!meta.empty() && meta.size()>4 && meta != "[]") {
      ParseMeta(meta);
    }
  }

  DBManager::~DBManager()
  {
    if (m_pDatabase != nullptr) {
      for (auto item : m_mDBs) {
        m_pDatabase->CloseDatabase(item.second);
      }
      m_mDBs.clear();
      for (auto item : m_mTables) {
        delete item.second;
      }
      m_mTables.clear();
      delete m_pDatabase;
      m_pDatabase = nullptr;
    }
  }

  std::vector<caxios::FileID> DBManager::GenerateNextFilesID(int cnt /*= 1*/)
  {
    std::vector<FileID> filesID;
    if (_flag == ReadOnly) return std::move(filesID);
    void* pData = nullptr;
    FileID lastID = 0;
    uint32_t len = 0;
    if (m_pDatabase->Get(m_mDBs[TABLE_FILESNAP], 0, pData, len)) {
      if (pData != nullptr) {
        lastID = *(FileID*)pData;
        T_LOG("val: %u, L: %d, %d", lastID, len, sizeof(uint32_t));
      }
    }
    for (int idx = 0; idx < cnt; ++idx) {
      lastID += 1;
      filesID.emplace_back(lastID);
    }
    m_pDatabase->Begin();
    if (!m_pDatabase->Put(m_mDBs[TABLE_FILESNAP], 0, &lastID, sizeof(FileID))) {
    }
    m_pDatabase->Commit();
    return std::move(filesID);
  }

  bool DBManager::AddFiles(const std::vector <std::tuple< FileID, MetaItems, Keywords >>& files)
  {
    if (_flag == ReadOnly) return false;
    m_pDatabase->Begin();
    for (auto item : files) {
      if (!AddFile(std::get<0>(item), std::get<1>(item), std::get<2>(item))) {
        return false;
      }
    }
    m_pDatabase->Commit();
    return true;
  }

  bool DBManager::SetTags(const std::vector<FileID>& filesID, const std::vector<std::string>& tags)
  {
    if (_flag == ReadOnly) return false;
    m_pDatabase->Begin();
    auto mIndexes = GetWordsIndex(tags);
    for (auto fileID : filesID) {
      // 所有标签以数组形式保存, 第0位为数组长度
      void* pData = nullptr;
      uint32_t len = 0;
      std::string value;
      WordIndex* indexes = (WordIndex*)malloc(tags.size() * sizeof(WordIndex));
      // 不存在则添加
      WordIndex* ptr = indexes;
      std::for_each(mIndexes.begin(), mIndexes.end(), [&ptr](std::pair<std::string, WordIndex> item) {
        *ptr = item.second;
        ++ptr;
      });
      m_pDatabase->Put(m_mDBs[TABLE_TAG], fileID, indexes, tags.size() * sizeof(WordIndex));
      free(indexes);
    }
    m_pDatabase->Commit();
    return true;
  }

  bool DBManager::GetFilesInfo(const std::vector<FileID>& filesID, std::vector< FileInfo>& filesInfo)
  {
    CHECK_DB_OPEN(TABLE_FILE_META);
    for (auto fileID: filesID)
    {
      void* pData = nullptr;
      uint32_t len = 0;
      if (!m_pDatabase->Get(m_mDBs[TABLE_FILE_META], fileID, pData, len)) {
        T_LOG("Get TABLE_FILE_META Fail: %d", fileID);
        continue;
      }
      std::string sMeta((char*)pData, len);
      T_LOG("meta: %s", sMeta.c_str());
      using namespace nlohmann;
      json meta = json::parse(sMeta);
      MetaItems items;
      for (auto value: meta) {
        MetaItem item;
        for (auto it = value.begin(); it!=value.end();++it)
        {
          item[it.key()] = trunc(it.value().dump());
        }
        items.emplace_back(item);
      }
      FileInfo fileInfo{ fileID, items, {}, {}, {} };
      filesInfo.emplace_back(fileInfo);
    }
    return true;
  }

  bool DBManager::GetFilesSnap(std::vector< Snap >& snaps)
  {
    CHECK_DB_OPEN(TABLE_FILESNAP);
    m_pDatabase->Each(m_mDBs[TABLE_FILESNAP], [&snaps](uint32_t k, void* pData, uint32_t len) -> bool {
      if (k == 0) return false;
      using namespace nlohmann;
      std::string js((char*)pData, len);
      json file=json::parse(js);
      T_LOG("GetFilesSnap: %s", js.c_str());
      try {
        std::string display = trunc(to_string(file["value"]));
        int step = atoi(file["step"].dump().c_str());
        Snap snap{ k, display, step };
        snaps.emplace_back(snap);
      }catch(json::exception& e){
        T_LOG("ERR: %s", e.what());
      }
      
      return false;
    });
    return true;
  }

  bool DBManager::FindFiles(const nlohmann::json& query, std::vector< FileInfo>& filesInfo)
  {
    m_qParser.Parse(query);
    m_qParser.Travel([&](IExpression* pExpression) {
      if (pExpression == nullptr) return;
      const std::string tableName = pExpression->GetKey();
      T_LOG("Travel: %s", tableName.c_str());
      if (m_mTables.find(tableName) == m_mTables.end()) return;
      std::vector<FileID> vFilesID;
      m_mTables[tableName]->Query(pExpression->GetValue(), vFilesID);
      this->GetFilesInfo(vFilesID, filesInfo);
      //if (pExpression->GetOperator() != EOperator::Terminate) {
      //}
      });
    return true;
  }

  bool DBManager::AddFile(FileID fileid, const MetaItems& meta, const Keywords& keywords)
  {
    using namespace nlohmann;
    json dbMeta;
    dbMeta = meta;
    std::string value = to_string(dbMeta);
    if (!m_pDatabase->Put(m_mDBs[TABLE_FILE_META], fileid, (void*)(value.data()), value.size())) {
      T_LOG("Put TABLE_FILE_META Fail %s", value.c_str());
      return false;
    }
    T_LOG("Write ID: %d, Meta Info: %s", fileid, value.c_str());
    //snap
    json snaps;
    for (MetaItem m: meta)
    {
      if (m["name"] == "filename"){
        snaps["value"] = m["value"];
        break;
      }
    }
    snaps["step"] = (char)0x1;
    std::string sSnaps = to_string(snaps);
    if (!m_pDatabase->Put(m_mDBs[TABLE_FILESNAP], fileid, (void*)(sSnaps.data()), sSnaps.size())) {
      T_LOG("Put TABLE_FILESNAP Fail %s", sSnaps.c_str());
      return false;
    }
    T_LOG("Write Snap: %s", sSnaps.c_str());
    // meta
    for (MetaItem m : meta) {
      std::string& name = m["name"];
      if(m_mTables.find(name) == m_mTables.end()) continue;
      std::vector<FileID> vID;
      vID.emplace_back(fileid);
      m_mTables[name]->Add(m["value"], vID);
    }
    return true;
  }

  bool DBManager::GetFileInfo(FileID fileID, MetaItems& meta, Keywords& keywords, Tags& tags, Annotations& anno)
  {
    return true;
  }

  bool DBManager::GetFileTags(FileID fileID, Tags& tags)
  {
    return true;
  }

  void DBManager::ParseMeta(const std::string& meta)
  {
    nlohmann::json jsn = nlohmann::json::parse(meta);
    for (auto item : jsn)
    {
      if (item["db"] == true) {
        std::string name = trunc(item["name"].dump());
        m_mTables[name] = new TableMeta(m_pDatabase, name, trunc(item["type"].dump()));
        //T_LOG("schema: %s", item["name"].dump().c_str());
      }
    }
    T_LOG("schema: %s", meta.c_str());
  }

  std::map<std::string, caxios::WordIndex> DBManager::GetWordsIndex(const std::vector<std::string>& words)
  {
    std::map<std::string, caxios::WordIndex> mIndexes;
    WordIndex lastIndx = 0;
    void* pData = nullptr;
    uint32_t len = 0;
    if (m_pDatabase->Get(m_mDBs[TABLE_KEYWORD_INDX], 0, pData, len)) {
      if (pData != nullptr) {
        lastIndx = *(WordIndex*)pData;
      }
    }
    lastIndx += 1;
    bool bUpdate = false;
    for (auto& word : words) {
      // 取字索引
      if (!m_pDatabase->Get(m_mDBs[TABLE_KEYWORD_INDX], word, pData, len)) {
        // 如果tag字符串不存在，添加
        m_pDatabase->Put(m_mDBs[TABLE_KEYWORD_INDX], word, &lastIndx, sizeof(WordIndex));
        mIndexes[word] = lastIndx;
        lastIndx += 1;
        bUpdate = true;
      }
    }
    if (bUpdate) {
      m_pDatabase->Put(m_mDBs[TABLE_KEYWORD_INDX], 0, &lastIndx, sizeof(WordIndex));
    }
    return std::move(mIndexes);
  }

}