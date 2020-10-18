#include "db_manager.h"
#include <iostream>
#include "log.h"
#include "util/util.h"
#include "Table.h"

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
    //if (!meta.empty() || meta != "[]") {
    //  ParseMeta(meta);
    //}
  }

  DBManager::~DBManager()
  {
    if (m_pDatabase != nullptr) {
      for (auto item : m_mDBs) {
        m_pDatabase->CloseDatabase(item.second);
      }
      m_mDBs.clear();
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

    }
    return true;
  }

  bool DBManager::GetFileInfo(FileID fileID, MetaItems& meta, Keywords& keywords, Tags& tags, Annotations& anno)
  {
    return true;
  }

  void DBManager::ParseMeta(const std::string& meta)
  {
    nlohmann::json jsn = nlohmann::json::parse(meta);
    for (auto item : jsn)
    {
      //std::cout << item.key() << std::endl;
    }
    T_LOG("schema: %s", meta.c_str());
  }

}