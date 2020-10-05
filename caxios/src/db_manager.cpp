#include "db_manager.h"
#include <iostream>
#include "json.hpp"
#include "log.h"
#include "util/util.h"

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

  DBManager::DBManager(const std::string& dbdir)
  {
    if (m_pDatabase == nullptr) {
      m_pDatabase = new CDatabase(dbdir);
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
      else {
        std::cerr << "Fail Open DB: " << g_tables[idx] << std::endl;
      }
    }
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
    if (!m_pDatabase->Put(m_mDBs[TABLE_FILESNAP], 0, &lastID, sizeof(FileID))) {
    }
    return std::move(filesID);
  }

  bool DBManager::AddFiles(const std::vector <std::tuple< FileID, MetaItems, Keywords >>& files)
  {
    for (auto item : files) {
      if (!AddFile(std::get<0>(item), std::get<1>(item), std::get<2>(item))) {
        return false;
      }
    }
    //m_pDatabase->Each(m_mDBs[TABLE_FILESNAP], [](uint32_t k, void* pData, uint32_t len) -> bool {
    //  return false;
    //});
    //m_pDatabase->Commit(m_mDBs[TABLE_FILE_META].second);
    return true;
  }

  bool DBManager::GetFilesSnap(std::vector< Snap >& snaps)
  {
    m_pDatabase->Each(m_mDBs[TABLE_FILESNAP], [&snaps](uint32_t k, void* pData, uint32_t len) -> bool {
      if (k == 0) return false;
      using namespace nlohmann;
      std::string js((char*)pData, len);
      json file=json::parse(js);
      T_LOG("GetFilesSnap: %s", js.c_str());
      try {
        std::string display = trunc(to_string(file["value"]));
        int step = atoi(file["step"].dump().c_str());
        Snap snap = { k, display, step };
        snaps.emplace_back(snap);
      }catch(json::exception& e){
        T_LOG("ERR: %s", e.what());
      }
      
      return false;
    });
    return true;
  }

  bool DBManager::AddFile(FileID fileid, const MetaItems& meta, const Keywords& keywords)
  {
    using namespace nlohmann;
    json files;
    files["meta"] = meta;
    std::string value = to_string(files);
    if (!m_pDatabase->Put(m_mDBs[TABLE_FILE_META], fileid, value.data(), value.size())) {
      T_LOG("Put TABLE_FILE_META Fail %s", value.c_str());
      return false;
    }
    //snap
    json snaps;
    for (MetaItem m: meta)
    {
      if (m["name"] == "title"){
        snaps["display"] = m["display"];
        break;
      }
    }
    snaps["step"] = (char)0x1;
    value = to_string(snaps);
    if (!m_pDatabase->Put(m_mDBs[TABLE_FILESNAP], fileid, value.data(), value.size())) {
      T_LOG("Put TABLE_FILESNAP Fail %s", value.c_str());
      return false;
    }
    return true;
  }

  bool DBManager::GetFileInfo(FileID fileID, MetaItems& meta, Keywords& keywords, Tags& tags, Annotations& anno)
  {
    return true;
  }

}