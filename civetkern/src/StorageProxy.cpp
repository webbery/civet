#include "StorageProxy.h"
#include "database.h"
#include "json.hpp"
#include "table/TableMeta.h"
#include <Table.h>
#include <thread>
#include "log.h"
#include <condition_variable>
#include <errno.h>
#include <filesystem>

namespace caxios{
  namespace {
    std::mutex g_qMutex;
    std::condition_variable g_qCV;
    std::deque<DML> g_dqDML;

    void addDML(const std::string& dbname, uint32_t key, void* pData, uint32_t len, int flag) {
      DML dml;
      dml._type = DML_Put;
      dml._ktype = KeyType_UInt32;
      dml._dbname = dbname;
      dml._key = std::string((char*)&key, sizeof(uint32_t));
      dml._data.assign((char*)pData, len);
      {
        std::unique_lock<std::mutex> l(g_qMutex);
        g_dqDML.emplace_back(dml);
      }
      g_qCV.notify_one();
    }
    void addDML(const std::string& dbname, const std::string& key, void* pData, uint32_t len, int flag) {
      DML dml;
      dml._type = DML_Put;
      dml._ktype = KeyType_String;
      if (dbname == "type") {
        T_LOG("qqq", "www");
      }
      dml._dbname = dbname;
      dml._key = key;
      dml._data.assign((char*)pData, len);
      {
        std::unique_lock<std::mutex> l(g_qMutex);
        g_dqDML.emplace_back(dml);
      }
      g_qCV.notify_one();
    }
    void addDML(const std::string& dbname, uint32_t key) {
      DML dml;
      dml._type = DML_Del;
      dml._ktype = KeyType_UInt32;
      dml._dbname = dbname;
      dml._key = std::string((char*)&key, sizeof(uint32_t));
      {
        std::unique_lock<std::mutex> l(g_qMutex);
        g_dqDML.emplace_back(dml);
      }
      g_qCV.notify_one();
    }
    void addDML(const std::string& dbname, const std::string& key) {
      DML dml;
      dml._type = DML_Del;
      dml._ktype = KeyType_String;
      dml._dbname = dbname;
      dml._key = key;
      {
        std::unique_lock<std::mutex> l(g_qMutex);
        g_dqDML.emplace_back(dml);
      }
      g_qCV.notify_one();
    }
  }
  CStorageProxy::CStorageProxy(const std::string& dbpath, const std::string& name, DBFlag flag, size_t size)
    :m_dir(dbpath), m_dbname(name)
  {
    m_pCurrent = new CDatabase(dbpath, name, flag, size);
    initKeyword();
  }

  CStorageProxy::~CStorageProxy()
  {
    m_bExit = true;
    ReleaseCurrentDB();
    if (m_tUpgrade.joinable()) {
      m_tUpgrade.join();
      ReplaceDB();
    }
  }

  MDB_dbi CStorageProxy::OpenDatabase(const std::string& dbname)
  {
    std::string tbName = realTableName(dbname);
    if (m_mDBs.find(tbName) != m_mDBs.end()) return m_mDBs[tbName];
    auto dbi = m_pCurrent->OpenDatabase(tbName);
    if (dbi == -1) return dbi;
    m_mDBs[tbName] = dbi;
    return dbi;
  }

  void CStorageProxy::CloseDatabase(const std::string& dbname)
  {
    auto dbi = getDBI(dbname);
    if (dbi == -1) return;
    m_pCurrent->CloseDatabase(dbi);
  }

  bool CStorageProxy::Put(const std::string& dbname, uint32_t key, void* pData, uint32_t len, int flag /*= MDB_CURRENT*/)
  {
    if (m_pUpgrade) {
      addDML(dbname, key, pData, len, flag);
    }
    auto dbi = getDBI(dbname);
    return m_pCurrent->Put(dbi, key, pData, len, flag);
  }

  bool CStorageProxy::Put(const std::string& dbname, const std::string& key, void* pData, uint32_t len, int flag /*= MDB_CURRENT*/)
  {
    if (m_pUpgrade) {
      addDML(dbname, key, pData, len, flag);
    }
    auto dbi = getDBI(dbname);
    return m_pCurrent->Put(dbi, key, pData, len, flag);
  }

  bool CStorageProxy::Get(const std::string& dbname, uint32_t key, void*& pData, uint32_t& len)
  {
    auto dbi = getDBI(dbname);
    return m_pCurrent->Get(dbi, key, pData, len);
  }

  bool CStorageProxy::Get(const std::string& dbname, const std::string& key, void*& pData, uint32_t& len)
  {
    auto dbi = getDBI(dbname);
    return m_pCurrent->Get(dbi, key, pData, len);
  }

  bool CStorageProxy::Filter(const std::string& dbname, std::function<bool(uint32_t key, void* pData, uint32_t len)> cb)
  {
    auto dbi = getDBI(dbname);
    return m_pCurrent->Filter(dbi, cb);
  }

  bool CStorageProxy::Filter(const std::string& dbname, std::function<bool(const std::string& key, void* pData, uint32_t len)> cb)
  {
    auto dbi = getDBI(dbname);
    return m_pCurrent->Filter(dbi, cb);
  }

  bool CStorageProxy::Del(const std::string& dbname, uint32_t key)
  {
    if (m_pUpgrade) {
      addDML(dbname, key);
    }
    auto dbi = getDBI(dbname);
    return m_pCurrent->Del(dbi, key);
  }

  bool CStorageProxy::Del(const std::string& dbname, const std::string& key)
  {
    if (m_pUpgrade) {
      addDML(dbname, key);
    }
    auto dbi = getDBI(dbname);
    return m_pCurrent->Del(dbi, key);
  }

  MDB_cursor* CStorageProxy::OpenCursor(const std::string& dbname)
  {
    auto dbi = getDBI(dbname);
    return m_pCurrent->OpenCursor(dbi);
  }

  int CStorageProxy::MoveNext(MDB_cursor* cursor, MDB_val& key, MDB_val& datum)
  {
    return m_pCurrent->MoveNext(cursor, key, datum);
  }

  void CStorageProxy::CloseCursor(MDB_cursor* pDurcor)
  {
    return m_pCurrent->CloseCursor(pDurcor);
  }

  MDB_txn* CStorageProxy::Begin()
  {
    return m_pCurrent->Begin();
  }

  bool CStorageProxy::Commit()
  {
    return m_pCurrent->Commit();
  }

  ITable* CStorageProxy::GetMetaTable(const std::string& name)
  {
    if (m_mTables.find(name) != m_mTables.end()) return m_mTables[name];
    void* pData = nullptr;
    uint32_t len = 0;
    this->Get(TABLE_MATCH_META, name, pData, len);
    if (len == 0) return nullptr;
    //std::vector<uint8_t> vInfo((uint8_t*)pData, (uint8_t*)pData + len);
    //nlohmann::json info = nlohmann::json::from_cbor(vInfo);
    m_mTables[name] = new TableMeta(this, name/*, info["type"]*/);
    return m_mTables[name];
  }

  ITable* CStorageProxy::GetOrCreateMetaTable(const std::string& name, const std::string& type)
  {
    ITable* pTable = GetMetaTable(name);
    if (!pTable) {
      nlohmann::json meta;
      meta["type"] = type;
      auto sInfo = nlohmann::json::to_cbor(meta);
      this->Put(TABLE_MATCH_META, name, sInfo.data(), sInfo.size());
      m_mTables[name] = new TableMeta(this, name/*, type*/);
      return m_mTables[name];
    }
    return pTable;
  }

  std::map<std::string, caxios::WordIndex> CStorageProxy::GetWordsIndex(const std::vector<std::string>& words)
  {
    std::map<std::string, caxios::WordIndex> mIndexes;
    WordIndex lastIndx = 0;
    void* pData = nullptr;
    uint32_t len = 0;
    if (this->Get(TABLE_KEYWORD_INDX, 0, pData, len)) {
      if (pData != nullptr) {
        lastIndx = *(WordIndex*)pData;
      }
    }
    lastIndx += 1;
    bool bUpdate = false;
    for (auto& word : words) {
      std::vector<std::string> vTokens = split(word, '/');
      for (auto& token : vTokens)
      {
        if (!this->Get(TABLE_KEYWORD_INDX, token, pData, len)) {
          //T_LOG("dict", "Add new word: %s", token.c_str());
          this->Put(TABLE_KEYWORD_INDX, token, &lastIndx, sizeof(WordIndex));
          this->Put(TABLE_INDX_KEYWORD, lastIndx, (void*)token.data(), token.size());
          mIndexes[token] = lastIndx;
          lastIndx += 1;
          bUpdate = true;
          continue;
        }
        mIndexes[token] = *(WordIndex*)pData;
        //T_LOG("dict", "Get word: %s, %d", token.c_str(), mIndexes[token]);
      }
    }
    if (bUpdate) {
      this->Put(TABLE_KEYWORD_INDX, 0, &lastIndx, sizeof(WordIndex));
    }
    //m_pDatabase->Filter(m_mDBs[TABLE_KEYWORD_INDX], [](const std::string& k, void* pData, uint32_t len)->bool {
    //  T_LOG("keyword indx: %s", k.c_str());
    //  return false;
    //});
    return std::move(mIndexes);
  }

  bool CStorageProxy::TryUpdate()
  {
    // TODO: 检查数据库版本是否匹配, 如果不匹配, 则开启线程，将当前数据库copy一份，进行升级, 并同步后续的所有写操作
    if (!ValidVersion()) {
      //std::thread th(std::bind(&CStorageProxy::UpgradeThread, this));
      //m_tUpgrade = std::move(th);
      std::string upgradePath = "/" + m_dbname + ".tmp";
      m_pCurrent->Copy2(m_dir + upgradePath);
      ReleaseCurrentDB();
      ReplaceDB();
      m_pCurrent = new CDatabase(m_dir, m_dbname, ReadWrite, MAX_SCHEMA_DB_SIZE);
      //m_pUpgrade = new CDatabase(m_dir, upgradePath, ReadWrite, MAX_SCHEMA_DB_SIZE);
      return true;
    }
    // TODO: 如果期间程序退出中断, 记录中断点, 下次启动时继续
    return false;
  }

  std::string CStorageProxy::realTableName(const std::string& name)
  {
    if (m_mDBs.find(name) == m_mDBs.end()) {
      auto itr = m_mKeywordMap.find(name);
      if (itr == m_mKeywordMap.end()) return std::move(name);
      return itr->second;
    }
    return std::move(name);
  }

  MDB_dbi CStorageProxy::getDBI(const std::string& name)
  {
    std::string tbName = realTableName(name);
    if (m_mDBs.find(tbName) == m_mDBs.end()) return -1;
    return m_mDBs[tbName];
  }

  void CStorageProxy::initKeyword()
  {
    m_mKeywordMap[TB_Keyword] = TABLE_KEYWORD2FILE;
    m_mKeywordMap[TB_Tag] = TABLE_TAG2FILE;
    m_mKeywordMap[TB_Class] = TABLE_CLASS2FILE;
    //m_mKeywordMap[TB_Annotation] = TABLE_KEYWORD2FILE;
    m_mKeywordMap[TB_FileID] = TABLE_FILE_META;
  }

  bool CStorageProxy::ValidVersion()
  {
    void* pData = nullptr;
    uint32_t len = 0;
    auto dbi = getDBI(TABLE_SCHEMA);
    m_pCurrent->Get(dbi, (uint32_t)SCHEMA_INFO::Version, pData, len);
    if (len == 0) {
      char dbvs = SCHEMA_VERSION;
      m_pCurrent->Put(dbi, (uint32_t)SCHEMA_INFO::Version, &dbvs, sizeof(char));
      return true;
    }
    char* pV = (char*)pData;
    if (*pV == SCHEMA_VERSION) return true;
    T_LOG("update", "current: %d, next: %d", *pV, SCHEMA_VERSION);
    return false;
  }

  void CStorageProxy::UpgradeThread()
  {
    std::string upgradePath = "/" + m_dbname + ".tmp";
    m_pCurrent->Copy2(m_dir + upgradePath);
    m_pUpgrade = new CDatabase(m_dir, upgradePath, ReadWrite, MAX_SCHEMA_DB_SIZE);
    std::map<std::string, MDB_dbi > mDBs;
    // process queue
    while (!m_bExit) {
      DML dml;
      dml._type = DML_None;
      {
        std::unique_lock<std::mutex> l(g_qMutex);
        if (g_dqDML.size() > 0) {
          dml = g_dqDML.front();
          g_dqDML.pop_front();
        }
        else if (g_qCV.wait_for(l, std::chrono::seconds(1)) == std::cv_status::timeout) {
          continue;
        }
      }
      ExecuteDML(dml, mDBs);
    }
    while (g_dqDML.size()) {
      DML dml = g_dqDML.front();
      g_dqDML.pop_front();
      ExecuteDML(dml, mDBs);
    }
    m_pUpgrade->Commit();
    // finish
    m_pUpgrade->CloseDatabase(0);
    delete m_pUpgrade;
    m_pUpgrade = nullptr;
  }

  void CStorageProxy::ExecuteDML(const DML& dml, std::map<std::string, MDB_dbi >& dbs)
  {
    if (dml._type == DML_None) return;
    if (dml._dbname == "type") {
      T_LOG("uery", "11");
    }
    if (dbs.find(dml._dbname) == dbs.end()) {
      MDB_dbi dbi = m_pUpgrade->OpenDatabase(dml._dbname);
      if (dbi == -1) return;
      dbs[dml._dbname] = dbi;
    }
    if (dml._type == DML_Put && dml._ktype == KeyType_UInt32) {
      uint32_t key = *(uint32_t*)dml._key.data();
      m_pUpgrade->Put(dbs[dml._dbname], key, (void*)dml._data.data(), dml._data.size(), MDB_CURRENT);
    }
    else if (dml._type == DML_Put && dml._ktype == KeyType_String) {
      m_pUpgrade->Put(dbs[dml._dbname], dml._key, (void*)dml._data.data(), dml._data.size(), MDB_CURRENT);
    }
    else if (dml._type == DML_Del && dml._ktype == KeyType_UInt32) {
      uint32_t key = *(uint32_t*)dml._key.data();
      m_pUpgrade->Del(dbs[dml._dbname], key);
    }
    else if (dml._type == DML_Del && dml._ktype == KeyType_String) {
      m_pUpgrade->Del(dbs[dml._dbname], dml._key);
    }
  }

  void CStorageProxy::ReplaceDB()
  {
    // swap database, upgrade finish
    std::string dbpath = m_dir + "/" + m_dbname;
    std::string oldName = m_dir + "/" + m_dbname + ".tmp";
    if (m_dir[0] != '/' && m_dir[1] != ':') {
      auto abspath = std::filesystem::current_path();
      dbpath = abspath.string() + "/" + dbpath;
      oldName = abspath.string() + "/" + oldName;
    }
    replace(oldName, dbpath);
    T_LOG("upgrade", "rm: %s, remain: %s", oldName.c_str(), dbpath.c_str());
  }

  void CStorageProxy::ReleaseCurrentDB()
  {
    m_mDBs.clear();
    for (auto item : m_mTables) {
      delete item.second;
    }
    m_mTables.clear();
    m_pCurrent->CloseDatabase(0);
    delete m_pCurrent;
  }

}