#include "database.h"
#include <iostream>
#if defined(__APPLE__) || defined(__gnu_linux__) || defined(__linux__) 
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#elif defined(WIN32)
#include <direct.h>
#include <io.h>
#endif
#include "util/util.h"
#include "log.h"
#include "table/TableMeta.h"
#include "json.hpp"
#include <Table.h>

#define MAX_NUM_DATABASE  64
#define UNIVERSAL_DELIMITER '/'
#if defined(__APPLE__) || defined(__gnu_linux__) || defined(__linux)
#define OS_DELIMITER '/'
#else
#define OS_DELIMITER '\\'
#endif
#define DBTHUMBMAIL "t_"    //thumbnail

namespace caxios {
  enum MetaType {
    BT_BINARY,
    BT_STRING,
    BT_VALUE
  };

  void MkDir(
#if defined(__APPLE__) || defined(__gnu_linux__) || defined(__linux__) 
    const std::string& dir
#else
    const std::wstring& dir
#endif
  ) {
#if defined(__APPLE__) || defined(__gnu_linux__) || defined(__linux__) 
    mkdir(dir.c_str()
      , 0777
#else
    _wmkdir(dir.c_str()
#endif
    );
  }
  bool isDirectoryExist(
#if defined(__APPLE__) || defined(UNIX) || defined(__linux__)
    const std::string& dir
#elif defined(WIN32)
    const std::wstring& dir
#endif
  ) {
#if defined(__APPLE__) || defined(UNIX) || defined(__linux__)
    if (access(dir.c_str(), 0) != -1) return true;
#elif defined(WIN32)
    if (_waccess(dir.c_str(), 0) == 0) return true;
#endif
    return false;
  }
  void createDirectories(
#if defined(__APPLE__) || defined(UNIX) || defined(__linux__)
    const std::string& dir
#elif defined(WIN32)
    const std::wstring& dir
#endif
  ) {
    if (isDirectoryExist(dir)) return;
    size_t pos = dir.rfind(UNIVERSAL_DELIMITER);
    if (pos == std::string::npos) {
      pos = dir.rfind(OS_DELIMITER);
      if (pos == std::string::npos) {
        MkDir(dir);
        return;
      }
    }
#if defined(__APPLE__) || defined(UNIX) || defined(__linux__)
    std::string parentDir;
#elif defined(WIN32)
    std::wstring parentDir;
#endif
    parentDir = dir.substr(0, pos);
    T_LOG("database", "parentDir: %s",parentDir.c_str());
    createDirectories(parentDir);
    MkDir(dir);
  }

  CDatabase::CDatabase(const std::string& dbpath, const std::string& name, DBFlag flag, size_t size) {
#if defined(__APPLE__) || defined(UNIX) || defined(__linux__)
    createDirectories(dbpath);
#elif defined(WIN32)
    auto wpath = string2wstring(dbpath);
    createDirectories(wpath);
#endif
    T_LOG("init", "createDirectories: %s", dbpath.c_str());
    if (flag == DBFlag::ReadOnly) m_flag = MDB_RDONLY;
    else m_flag = MDB_WRITEMAP;

    mdb_env_create(&m_pDBEnv);
    mdb_env_set_maxreaders(m_pDBEnv, 4);

    if (const int rc = mdb_env_set_mapsize(m_pDBEnv, size)) {
      T_LOG("init", "mdb_env_set_mapsize fail: %s", err2str(rc).c_str());
      mdb_env_close(m_pDBEnv);
      return;
    }
    if (const int rc = mdb_env_set_maxdbs(m_pDBEnv, MAX_NUM_DATABASE)) {
      T_LOG("init", "mdb_env_set_maxdbs fail: %s", err2str(rc).c_str());
      mdb_env_close(m_pDBEnv);
      return;
    }
    //open_flag |= MDB_NOTLS;
    const std::string schemaDB = dbpath + OS_DELIMITER + name;
    T_LOG("database", "Open DB %s, flag: %d, Mode: %s", schemaDB.c_str(), m_flag, m_flag == MDB_RDONLY? "ReadOnly": "ReadWrite");
    if (const int rc = mdb_env_open(m_pDBEnv, schemaDB.c_str(), m_flag | MDB_NOTLS | MDB_NORDAHEAD | MDB_NOSUBDIR | MDB_NOLOCK, 0664)) {
      T_LOG("database", "mdb_env_open fail: %s", err2str(rc).c_str());
    }
    if (const int rc = mdb_txn_begin(m_pDBEnv, 0, m_flag, &m_pTransaction)) {
      T_LOG("database", "mdb_txn_begin fail: %s", err2str(rc).c_str());
    }
    initKeyword();
  }
  CDatabase::~CDatabase() {
    for (auto item : m_mTables) {
      delete item.second;
    }
    m_mTables.clear();
    mdb_env_close(m_pDBEnv);
    T_LOG("database", "~CDatabase()");
  }

  MDB_dbi CDatabase::OpenDatabase(const std::string& dbname)
  {
    MDB_dbi dbi = -1;
    unsigned int flag = MDB_CREATE;
    if (m_flag & MDB_RDONLY) flag = 0;
    std::string tbName = realTableName(dbname);
    if (m_mDBs.find(tbName) != m_mDBs.end()) return m_mDBs[tbName];
    if (const int rc = mdb_dbi_open(m_pTransaction, tbName.c_str(), flag, &dbi)) {
      T_LOG("database", "mdb_dbi_open %s fail %s", tbName.c_str(), err2str(rc).c_str());
      return dbi;
    }
    m_mDBs[tbName] = dbi;
    T_LOG("database", "mdb_dbi_open %d, %s", dbi, tbName.c_str());
    return dbi;
  }

  void CDatabase::CloseDatabase(const std::string& dbname)
  {
    if (m_pDBEnv) {
      this->Commit();
      mdb_env_sync(m_pDBEnv, 1);
      m_pDBEnv = nullptr;
    }
    std::string tbName = realTableName(dbname);
    T_LOG("database", "mdb_close %d", m_mDBs[tbName]);
    //mdb_close(m_pDBEnv, dbi);
  }

  bool CDatabase::Put(const std::string& dbname, uint32_t k, void* pData, uint32_t len, int flag) {
    MDB_val key, datum;
    key.mv_data = reinterpret_cast<void*>(&k);
    key.mv_size = sizeof(uint32_t);
    datum.mv_data = pData;
    datum.mv_size = len;
    std::string tbName = realTableName(dbname);
    if (int rc = mdb_put(m_pTransaction, m_mDBs[tbName], &key, &datum, 0)) {
      T_LOG("database", "mdb_put fail: %s, key: %d, data: %p, len: %d", err2str(rc).c_str(), k, pData, len);
      return false;
    }
    if (m_dOperator == NORMAL) {
      m_dOperator = TRANSACTION;
    }
    T_LOG("database", "mdb_put %d, key: %d", m_mDBs[dbname], k);
    return true;
  }

  bool CDatabase::Put(const std::string& dbname, const std::string& k, void* pData, uint32_t len, int flag /*= MDB_CURRENT*/)
  {
    MDB_val key, datum;
    key.mv_data = (void*)(k.data());
    key.mv_size = k.size();
    datum.mv_data = pData;
    datum.mv_size = len;
    std::string tbName = realTableName(dbname);
    if (int rc = mdb_put(m_pTransaction, m_mDBs[tbName], &key, &datum, 0)) {
      T_LOG("database", "mdb_put fail: %s, key: %s", err2str(rc).c_str(), k.c_str());
      return false;
    }
    if (m_dOperator == NORMAL) {
      m_dOperator = TRANSACTION;
    }
    T_LOG("database", "mdb_put %d, key: %s", m_mDBs[tbName], k.c_str());
    return true;
  }

  bool CDatabase::Get(const std::string& dbname, uint32_t k, void*& pData, uint32_t& len)
  {
    MDB_val key, datum = { 0 };
    key.mv_data = reinterpret_cast<void*>(&k);
    key.mv_size = sizeof(uint32_t);
    this->Begin();
    std::string tbName = realTableName(dbname);
    if (int rc = mdb_get(m_pTransaction, m_mDBs[tbName], &key, &datum)) {
      T_LOG("database", "mdb_get %s fail: %s, key: %d", tbName.c_str(), err2str(rc).c_str(), k);
      //pData = nullptr;
      len = 0;
      return false;
    }
    len = datum.mv_size;
    pData = datum.mv_data;
    T_LOG("database", "mdb_get %d, key: %u, len: %d", m_mDBs[tbName], k, len);
    return true;
  }

  bool CDatabase::Get(const std::string& dbname, const std::string& k, void*& pData, uint32_t& len)
  {
    MDB_val key, datum = { 0 };
    key.mv_data = (void*)(k.data());
    key.mv_size = k.size();
    this->Begin();
    std::string tbName = realTableName(dbname);
    if (int rc = mdb_get(m_pTransaction, m_mDBs[tbName], &key, &datum)) {
      T_LOG("database", "mdb_get fail: %s", err2str(rc).c_str());
      len = 0;
      return false;
    }
    len = datum.mv_size;
    pData = datum.mv_data;
    T_LOG("database", "mdb_get %d, key: %s, len: %d", m_mDBs[tbName], k.c_str(), len);
    return true;
  }

  bool CDatabase::Filter(const std::string& dbname, std::function<bool(uint32_t key, void* pData, uint32_t len)> cb)
  {
    MDB_cursor* cursor = nullptr;
    int rc = 0;
    this->Begin();
    std::string tbName = realTableName(dbname);
    if (rc = mdb_cursor_open(m_pTransaction, m_mDBs[tbName], &cursor)) {
      T_LOG("database", "mdb_cursor_open fail: %s, transaction: %d", err2str(rc).c_str(), m_pTransaction);
      return false;
    }

    MDB_val key, datum = { 0 };
    while ((rc = mdb_cursor_get(cursor, &key, &datum, MDB_NEXT)) == 0) {
      //printf("key: %u, data: %d %s\n",
      //  *(uint32_t*)(key.mv_data),
      //  (int)datum.mv_size, (char*)datum.mv_data);
      if (cb(*(uint32_t*)(key.mv_data), datum.mv_data, datum.mv_size)) {
        break;
      }
    }
    mdb_cursor_close(cursor);
    return true;
  }

  bool CDatabase::Filter(const std::string& dbname, std::function<bool(const std::string& key, void* pData, uint32_t len)> cb)
  {
    MDB_cursor* cursor = nullptr;
    int rc = 0;
    this->Begin();
    std::string tbName = realTableName(dbname);
    if (rc = mdb_cursor_open(m_pTransaction, m_mDBs[tbName], &cursor)) {
      T_LOG("database", "mdb_cursor_open fail: %s, transaction: %d", err2str(rc).c_str(), m_pTransaction);
      return false;
    }

    MDB_val key, datum = { 0 };
    while ((rc = mdb_cursor_get(cursor, &key, &datum, MDB_NEXT)) == 0) {
      //printf("key: %u, data: %d %s\n",
      //  *(uint32_t*)(key.mv_data),
      //  (int)datum.mv_size, (char*)datum.mv_data);
      std::string sKey((char*)key.mv_data, key.mv_size);
      if (cb(sKey, datum.mv_data, datum.mv_size)) {
        break;
      }
    }
    mdb_cursor_close(cursor);
    return true;
  }

  bool CDatabase::Del(const std::string& dbname, uint32_t k)
  {
    MDB_val key, datum = { 0 };
    key.mv_data = reinterpret_cast<void*>(&k);
    key.mv_size = sizeof(uint32_t);

    std::string tbName = realTableName(dbname);
    if (int rc = mdb_del(m_pTransaction, m_mDBs[tbName], &key, NULL)) {
      T_LOG("database", "mdb_del fail: %s", err2str(rc).c_str());
      return false;
    }
    if (m_dOperator == NORMAL) {
      m_dOperator = TRANSACTION;
    }
    return true;
  }

  bool CDatabase::Del(const std::string& dbname, const std::string& k)
  {
    MDB_val key, datum = { 0 };
    key.mv_data = (void*)(k.data());
    key.mv_size = k.size();

    std::string tbName = realTableName(dbname);
    if (int rc = mdb_del(m_pTransaction, m_mDBs[tbName], &key, NULL)) {
      T_LOG("database", "mdb_del fail: %s", err2str(rc).c_str());
      return false;
    }
    if (m_dOperator == NORMAL) {
      m_dOperator = TRANSACTION;
    }
    return true;
  }

  MDB_cursor* CDatabase::OpenCursor(const std::string& dbname)
  {
    MDB_cursor* cursor = nullptr;
    this->Begin();
    std::string tbName = realTableName(dbname);
    if (int rc = mdb_cursor_open(m_pTransaction, m_mDBs[tbName], &cursor)) {
      T_LOG("database", "mdb_cursor_open fail: %s, transaction: %d", err2str(rc).c_str(), m_pTransaction);
      return nullptr;
    }
    return cursor;
  }

  int CDatabase::MoveNext(MDB_cursor* cursor, MDB_val& key, MDB_val& datum)
  {
    return mdb_cursor_get(cursor, &key, &datum, MDB_NEXT);
  }

  void CDatabase::CloseCursor(MDB_cursor* cursor)
  {
    mdb_cursor_close(cursor);
  }

  MDB_txn* CDatabase::Begin()
  {
    if (m_pTransaction == nullptr) {
      if (int rc = mdb_txn_begin(m_pDBEnv, 0, m_flag, &m_pTransaction)) {
        T_LOG("database", "mdb_txn_begin: %s", err2str(rc).c_str());
        return nullptr;
      }
      return m_pTransaction;
    }
    return nullptr;
  }

  bool CDatabase::Commit()
  {
    if (m_dOperator == NORMAL) return true;
    if (int rc = mdb_txn_commit(m_pTransaction)) {
      T_LOG("database", "mdb_txn_commit: %s", err2str(rc).c_str());
      return false;
    }
    m_pTransaction = nullptr;
    T_LOG("database", "mdb_txn_commit");
    m_dOperator = NORMAL;
    return true;
  }

  ITable* CDatabase::GetMetaTable(const std::string& name)
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

  ITable* CDatabase::GetOrCreateMetaTable(const std::string& name, const std::string& type)
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

  std::map<std::string, caxios::WordIndex> CDatabase::GetWordsIndex(const std::vector<std::string>& words)
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
        // 取字索引
        if (!this->Get(TABLE_KEYWORD_INDX, token, pData, len)) {
          // 如果tag字符串不存在，添加
          T_LOG("dict", "Add new word: %s", token.c_str());
          this->Put(TABLE_KEYWORD_INDX, token, &lastIndx, sizeof(WordIndex));
          this->Put(TABLE_INDX_KEYWORD, lastIndx, (void*)token.data(), token.size());
          mIndexes[token] = lastIndx;
          lastIndx += 1;
          bUpdate = true;
          continue;
        }
        mIndexes[token] = *(WordIndex*)pData;
        T_LOG("dict", "Get word: %s, %d", token.c_str(), mIndexes[token]);
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

  std::string CDatabase::realTableName(const std::string& name)
  {
    if (m_mDBs.find(name) == m_mDBs.end()) {
      auto itr = m_mKeywordMap.find(name);
      if (itr == m_mKeywordMap.end()) return std::move(name);
      return itr->second;
    }
    return std::move(name);
  }

  void CDatabase::initKeyword()
  {
    m_mKeywordMap[TB_Keyword] = TABLE_KEYWORD2FILE;
    m_mKeywordMap[TB_Tag] = TABLE_TAG2FILE;
    m_mKeywordMap[TB_Class] = TABLE_CLASS2FILE;
    //m_mKeywordMap[TB_Annotation] = TABLE_KEYWORD2FILE;
    m_mKeywordMap[TB_FileID] = TABLE_FILE_META;
  }

}