#include "db_manager.h"
#include <iostream>
#include "json.hpp"

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
        std::cout << " Open: " << g_tables[idx] << std::endl;
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
      delete m_pDatabase;
    }
  }

  std::vector<caxios::FileID> DBManager::GenerateNextFilesID(int cnt /*= 1*/)
  {
    std::vector<FileID> filesID;
    void* pData = nullptr;
    FileID lastID = 0;
    size_t len = 0;
    if (m_pDatabase->Get(m_mDBs[TABLE_FILESNAP], 0, pData, len)) {
      if (pData != nullptr) {
        lastID = *(FileID*)pData;
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
    m_pDatabase->Commit();
    return true;
  }

  bool DBManager::GetFilesSnap(std::vector< Snap >& snaps)
  {
    //m_pDatabase->Get(m_mDBs[TABLE_FILESNAP], )
    return true;
  }

  bool DBManager::AddFile(FileID fileid, const MetaItems& meta, const Keywords& keywords)
  {
    using namespace nlohmann;
    json files;
    files["meta"] = meta;
    std::string value = to_string(files);
    //std::cout << files << std::endl;
    if (!m_pDatabase->Put(m_mDBs[TABLE_FILE_META], fileid, value.data(), value.size())) {
      return false;
    }
    //snap
    json snaps;
    snaps["display"] = "";
    snaps["step"] = (char)0x1;
    value = to_string(snaps);
    if (!m_pDatabase->Put(m_mDBs[TABLE_FILESNAP], fileid, value.data(), value.size())) {
      return false;
    }
    return true;
  }

  bool DBManager::GetFileInfo(FileID fileID, MetaItems& meta, Keywords& keywords, Tags& tags, Annotations& anno)
  {
    return true;
  }

}