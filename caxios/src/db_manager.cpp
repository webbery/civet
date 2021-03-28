#include "db_manager.h"
#include <iostream>
#include "log.h"
#include "util/util.h"
#include "table/TableMeta.h"
#include "table/TableTag.h"
#include <set>
#include <utility>
#include <deque>
#include "util/pinyin.h"
//#include "QueryAction.h"
#include "QuerySelector.h"
#include "RPN.h"
#include <stack>

#define CHILD_START_OFFSET  2

#define READ_BEGIN(dbname) \
  if (m_pDatabase->OpenDatabase(dbname) == -1) {\
    T_LOG("manager", "OpenDatabase fail: %s", dbname);\
    return false;\
  }

#define WRITE_BEGIN()  m_pDatabase->Begin()
#define WRITE_END()    m_pDatabase->Commit()

#define BIT_INIT_OFFSET  0
#define BIT_TAG_OFFSET   1
#define BIT_CLASS_OFFSET 2
#define BIT_TAG     (1<<BIT_TAG_OFFSET)
#define BIT_CLASS   (1<<BIT_CLASS_OFFSET)
//#define BIT_ANNO  (1<<3)

#define DBSCHEMA  "schema"
#define DBBIN  "bin"

namespace caxios {
  const char* g_tables[] = {
    TABLE_SCHEMA,
    TABLE_FILESNAP,
    TABLE_FILE_META,
    TABLE_KEYWORD_INDX,
    TABLE_INDX_KEYWORD,
    TABLE_KEYWORD2FILE,
    TABLE_FILE2KEYWORD,
    TABLE_KEYWORD2CLASS,
    TABLE_FILE2TAG,
    TABLE_TAG2FILE,
    TABLE_TAG_INDX,
    TABLE_HASH2CLASS,
    TABLE_CLASS2HASH,
    TABLE_FILE2CLASS,
    TABLE_CLASS2FILE,
    TABLE_COUNT,
    TABLE_ANNOTATION,
    TABLE_MATCH_META,
    TABLE_MATCH
  };

  namespace {
    std::vector<WordIndex> transform(const std::vector<std::string>& words, std::map<std::string, WordIndex>& mIndexes) {
      std::vector<WordIndex> vIndexes;
      vIndexes.resize(words.size());
      std::transform(words.begin(), words.end(), vIndexes.begin(), [&mIndexes](const std::string& word)->WordIndex {
        return mIndexes[word];
        });
      return vIndexes;
    }
  }
  DBManager::DBManager(const std::string& dbdir, int flag, const std::string& meta/* = ""*/)
  {
    _flag = (flag == 0 ? ReadWrite : ReadOnly);
#ifdef _DEBUG
#define MAX_SCHEMA_DB_SIZE  5*1024*1024
#define MAX_BIN_DB_SIZE     5*1024*1024
#else
#define MAX_SCHEMA_DB_SIZE  128*1024*1024
#define MAX_BIN_DB_SIZE     256*1024*1024
#endif
    InitDB(m_pDatabase, dbdir.c_str(), DBSCHEMA, MAX_SCHEMA_DB_SIZE);
    InitDB(m_pBinaryDB, dbdir.c_str(), DBBIN, MAX_BIN_DB_SIZE);
    
    // open all database
    int cnt = sizeof(g_tables) / sizeof(char*);
    for (int idx = 0; idx < cnt; ++idx) {
      MDB_dbi dbi = m_pDatabase->OpenDatabase(g_tables[idx]);
    }
    //m_mTables["class"] = new TableClass(m_pDatabase, "class");
    //m_mTables["tag"] = new TableTag(m_pDatabase);
    if (!meta.empty() && meta.size()>4 && meta != "[]") {
      ParseMeta(meta);
    }
    if (_flag == ReadWrite) {
      if (!IsClassExist(ROOT_CLASS_PATH)) {
        InitClass(ROOT_CLASS_PATH, 0, 0);
      }
    }
    // 检查数据库版本是否匹配, 如果不匹配, 则开启线程，将当前数据库copy一份，进行升级, 并同步后续的所有写操作
    if (!ValidVersion()) {

    }
    // 如果期间程序退出中断, 记录中断点, 下次启动时继续 
  }

  DBManager::~DBManager()
  {
    if (m_pBinaryDB) {
      delete m_pBinaryDB;
      m_pBinaryDB = nullptr;
    }

    if (m_pDatabase != nullptr) {
      int cnt = sizeof(g_tables) / sizeof(char*);
      for (int idx = 0; idx < cnt; ++idx) {
        m_pDatabase->CloseDatabase(g_tables[idx]);
      }
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
    if (m_pDatabase->Get(TABLE_FILESNAP, 0, pData, len)) {
      if (pData != nullptr) {
        lastID = *(FileID*)pData;
        T_LOG("generate", "val: %u, L: %u, %d", lastID, len, sizeof(uint32_t));
      }
    }
    for (int idx = 0; idx < cnt; ++idx) {
      lastID += 1;
      filesID.emplace_back(lastID);
    }
    WRITE_BEGIN();
    if (!m_pDatabase->Put(TABLE_FILESNAP, 0, &lastID, sizeof(FileID))) {
    }
    WRITE_END();
    return std::move(filesID);
  }

  bool DBManager::AddFiles(const std::vector <std::tuple< FileID, MetaItems, Keywords >>& files)
  {
    if (_flag == ReadOnly) return false;
    WRITE_BEGIN();
    for (auto item : files) {
      if (!AddFile(std::get<0>(item), std::get<1>(item), std::get<2>(item))) {
        return false;
      }
    }
    WRITE_END();
    return true;
  }

  bool DBManager::AddClasses(const std::vector<std::string>& classes, const std::vector<FileID>& filesID)
  {
    if (_flag == ReadOnly || classes.size() == 0) return false;
    WRITE_BEGIN();
    std::vector<FileID> existID = mapExistFiles(filesID);
    auto mIndexes = m_pDatabase->GetWordsIndex(classes);
    T_LOG("class", "mIndexes size: %llu, classes: %s", mIndexes.size(), format_vector(classes).c_str());
    // add classes which is not exist
    std::vector<uint32_t> vClasses = this->AddClassImpl(classes);
    // add file to classes and classes to file
    for (auto cid: vClasses)
    {
      this->AddClass2FileID(cid, existID);
      this->AddFileID2Class(existID, cid);
    }
    // update file keywords for search
    for (auto fid : existID) {
      for (auto& item : mIndexes) {
        BindKeywordAndFile(item.second, fid);
      }
      SetSnapStep(fid, BIT_CLASS_OFFSET);
    }
    WRITE_END();
    return true;
  }

  bool DBManager::AddClasses(const std::vector<std::string>& classes)
  {
    if (_flag == ReadOnly || classes.size() == 0) return false;
    WRITE_BEGIN();
    this->AddClassImpl(classes);
    WRITE_END();
    return true;
  }

  bool DBManager::AddMeta(const std::vector<FileID>& files, const nlohmann::json& meta)
  {
    auto existFiles = mapExistFiles(files);
    if (existFiles.size() == 0) return false;
    WRITE_BEGIN();
    std::string name = meta["name"];
    std::string type = meta["type"];
    if (type == "bin") {

    }
    // add meta to file
    void* pData = nullptr;
    uint32_t len = 0;
    for (FileID fid : existFiles) {
      m_pDatabase->Get(TABLE_FILE_META, fid, pData, len);
      std::vector<uint8_t> info((uint8_t*)pData, (uint8_t*)pData + len);
      nlohmann::json fileMeta = nlohmann::json::from_cbor(info);
      fileMeta.push_back(meta);
      //T_LOG("file", "add new meta, result: %s", fileMeta.dump().c_str());
      auto vData = nlohmann::json::to_cbor(fileMeta);
      m_pDatabase->Put(TABLE_FILE_META, fid, (void*)vData.data(), vData.size());
    }
    // add to meta table
    if (meta["query"] == true && type != "bin") {
      auto pTable = m_pDatabase->GetOrCreateMetaTable(name, meta["type"]);
      std::vector<std::string> vStr = meta["value"];
      for (auto& val : vStr) {
        pTable->Add(val, existFiles);
      }
    }
    WRITE_END();
    return true;
  }

  bool DBManager::RemoveFiles(const std::vector<FileID>& filesID)
  {
    WRITE_BEGIN();
    //auto existFiles = mapExistFiles(filesID);
    T_LOG("file", "exist files: %s", format_vector(filesID).c_str());
    for (auto fileID : filesID)
    {
      T_LOG("file", "remove file id: %d", fileID);
      RemoveFile(fileID);
    }
    WRITE_END();
    return true;
  }

  bool DBManager::RemoveTags(const std::vector<FileID>& filesID, const Tags& tags)
  {
    WRITE_BEGIN();
    auto mWordsIndex = m_pDatabase->GetWordsIndex(tags);
    std::vector<WordIndex> vTags;
    std::for_each(mWordsIndex.begin(), mWordsIndex.end(), [&vTags](const std::pair<std::string, WordIndex>& item) {
      vTags.emplace_back(item.second);
    });
    void* pData = nullptr;
    uint32_t len = 0;
    for (auto fileID : filesID)
    {
      m_pDatabase->Get(TABLE_FILE2TAG, fileID, pData, len);
      if (len) {
        std::vector<WordIndex> vTagIdx((WordIndex*)pData, (WordIndex*)pData + len / sizeof(WordIndex));
        eraseData(vTagIdx, vTags);
        m_pDatabase->Put(TABLE_FILE2TAG, fileID, vTagIdx.data(), vTagIdx.size() * sizeof(WordIndex));
        if (vTagIdx.size() == 0) {
          SetSnapStep(fileID, BIT_TAG_OFFSET, false);
        }
      }
    }
    for (auto tagID : vTags) {
      m_pDatabase->Get(TABLE_TAG2FILE, tagID, pData, len);
      if (len) {
        std::vector<FileID> vFils((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
        eraseData(vFils, filesID);
        m_pDatabase->Put(TABLE_TAG2FILE, tagID, vFils.data(), vFils.size() * sizeof(FileID));
      }
    }
    RemoveKeywords(filesID, tags);
    WRITE_END();
    return true;
  }

  bool DBManager::RemoveClasses(const std::vector<std::string>& classes)
  {
    WRITE_BEGIN();

    for (auto& clsPath : classes) {
      T_LOG("class", "remove class %s", clsPath.c_str());
      RemoveClassImpl(clsPath);
    }

    WRITE_END();
    return true;
  }

  bool DBManager::RemoveClasses(const std::vector<std::string>& classes, const std::vector<FileID>& filesID)
  {
    // update keyword of files
    RemoveKeywords(filesID, classes);

    std::vector<ClassID> vClassID;
    for (auto& cPath : classes) {
      ClassID cid;
      std::string _s;
      std::tie(cid, _s) = EncodePath2Hash(cPath);
      vClassID.emplace_back(cid);
    }
    void* pData = nullptr;
    uint32_t len = 0;
    // remove file 2 classes
    for (FileID fid : filesID) {
      m_pDatabase->Get(TABLE_FILE2CLASS, fid, pData, len);
      if (len) {
        std::vector<ClassID> vSrcID((ClassID*)pData, (ClassID*)pData + len / sizeof(ClassID));
        eraseData(vSrcID, vClassID);
        m_pDatabase->Put(TABLE_FILE2CLASS, fid, vSrcID.data(), vSrcID.size() * sizeof(ClassID));
      }
    }
    // remove classes 2 file
    for (ClassID cid : vClassID) {
      m_pDatabase->Get(TABLE_CLASS2FILE, cid, pData, len);
      if (len) {
        std::vector<FileID> vSrcID((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
        eraseData(vSrcID, filesID);
        m_pDatabase->Put(TABLE_CLASS2FILE, cid, vSrcID.data(), vSrcID.size() * sizeof(FileID));
      }
    }
    return true;
  }

  bool DBManager::SetTags(const std::vector<FileID>& filesID, const std::vector<std::string>& tags)
  {
    if (_flag == ReadOnly) return false;
    WRITE_BEGIN();
    std::vector<FileID> existID = mapExistFiles(filesID);
    auto mIndexes = m_pDatabase->GetWordsIndex(tags);
    std::for_each(mIndexes.begin(), mIndexes.end(), [this, &existID](std::pair<std::string, WordIndex> item) {
      AddTagPY(item.first, item.second);
      AddFileID2Tag(existID, item.second);
      T_LOG("tag", "files ID: %s, tag index: %d", format_vector(existID).c_str(), item.second);
      for (FileID fileID : existID) {
        this->AddFileID2Keyword(fileID, item.second);
        this->AddKeyword2File(item.second, fileID);
      }
    });
    for (auto fileID : existID) {
      if (!IsFileExist(fileID)) continue;
      std::vector<WordIndex> vTags;
      // 不存在则添加
      std::for_each(mIndexes.begin(), mIndexes.end(), [&vTags](std::pair<std::string, WordIndex> item) {
        addUniqueDataAndSort(vTags, item.second);
      });
      m_pDatabase->Put(TABLE_FILE2TAG, fileID, vTags.data(), tags.size() * sizeof(WordIndex));
      SetSnapStep(fileID, BIT_TAG_OFFSET);
    }
    WRITE_END();
    return true;
  }

  bool DBManager::GetFilesInfo(const std::vector<FileID>& filesID, std::vector< FileInfo>& filesInfo)
  {
    READ_BEGIN(TABLE_FILE_META);
    for (auto fileID: filesID)
    {
      void* pData = nullptr;
      uint32_t len = 0;
      if (!m_pDatabase->Get(TABLE_FILE_META, fileID, pData, len)) {
        T_LOG("files", "Get TABLE_FILE_META Fail: %d", fileID);
        continue;
      }
      std::vector<uint8_t> sMeta((uint8_t*)pData, (uint8_t*)pData + len);
      // std::string sDebug((char*)pData, 500 <len? 500: len);
      // T_LOG("files", "meta: %s", sDebug.c_str());
      using namespace nlohmann;
      json meta = json::from_cbor(sMeta);
      MetaItems items;
      for (auto value: meta) {
        MetaItem item;
        for (auto it = value.begin(); it!=value.end();++it)
        {
          item[it.key()] = trunc(it.value().dump());
          //T_LOG("file", "file %d, get meta %s: %s", fileID, it.key().c_str(), it.value().dump().c_str());
        }
        items.emplace_back(item);
      }
      // tag
      Tags tags;
      if (m_pDatabase->Get(TABLE_FILE2TAG, fileID, pData, len)) {
        WordIndex* pWordIndex = (WordIndex*)pData;
        tags = GetWordByIndex(pWordIndex, len/sizeof(WordIndex));
        T_LOG("files", "file tags cnt: %llu", tags.size());
        for (auto& t : tags)
        {
          T_LOG("files", "file %d tags: %s", fileID, t.c_str());
        }
      }
      // ann
      // clazz
      Classes classes;
      if (m_pDatabase->Get(TABLE_FILE2CLASS, fileID, pData, len)) {
        uint32_t* pClassID = (uint32_t*)pData;
        for (size_t idx = 0; idx < len / sizeof(uint32_t); ++idx) {
          std::string clsName = GetClassByHash(*(pClassID + idx));
          classes.push_back(clsName);
          T_LOG("files", "class id: %d, name: %s", *(pClassID + idx), clsName.c_str());
        }
      }
      // keyword
      Keywords keywords;
      if (m_pDatabase->Get(TABLE_FILE2KEYWORD, fileID, pData, len)) {
        WordRef* pWordIndex = (WordRef*)pData;
        keywords = GetWordByIndex(pWordIndex, len / sizeof(WordRef));
        T_LOG("files", "keyword[%llu]: %s", keywords.size(), format_vector(keywords).c_str());
      }
      FileInfo fileInfo{ fileID, items, tags, classes, {}, keywords };
      filesInfo.emplace_back(fileInfo);
    }
    return true;
  }

  bool DBManager::GetFilesSnap(std::vector< Snap >& snaps)
  {
    READ_BEGIN(TABLE_FILESNAP);
    m_pDatabase->Filter(TABLE_FILESNAP, [&snaps](uint32_t k, void* pData, uint32_t len) -> bool {
      if (k == 0) return false;
      using namespace nlohmann;
      std::string js((char*)pData, len);
      json file=json::parse(js);
      T_LOG("snap", "GetFilesSnap: %s", js.c_str());
      try {
        std::string display = trunc(to_string(file["value"]));
        std::string val = trunc(file["step"].dump());
        T_LOG("snap", "File step: %s", val.c_str());
        int step = std::stoi(val);
        T_LOG("snap", "File step: %d, %s", step, val.c_str());
        Snap snap{ k, display, step };
        snaps.emplace_back(snap);
      }catch(json::exception& e){
        T_LOG("snap", "ERR: %s", e.what());
      }
      return false;
    });
    return true;
  }

  size_t DBManager::GetFileCountOfClass(ClassID cid)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_CLASS2FILE, cid, pData, len);
    return len / sizeof(FileID);
  }

  size_t DBManager::GetAllFileCountOfClass(ClassID cid)
  {
    size_t count = GetFileCountOfClass(cid);
    auto key = GetClassKey(cid);
    auto children = GetClassChildren(key);
    for (int idx = 0; idx < children.size();) {
      ClassID child = children[idx];
      count += GetFileCountOfClass(child);
      children.erase(children.begin());
      auto ck = GetClassKey(child);
      auto cc = GetClassChildren(ck);
      if (cc.size()) children.insert(children.end(), cc.begin(),cc.end());
    }
    return count;
  }

  bool DBManager::GetUntagFiles(std::vector<FileID>& filesID)
  {
    std::vector<Snap> vSnaps;
    if (!GetFilesSnap(vSnaps)) return false;
    T_LOG("tag", "File Snaps: %llu", vSnaps.size());
    for (auto& snap : vSnaps) {
      char bits = std::get<2>(snap);
      T_LOG("tag", "untag file %d: %d", std::get<0>(snap), bits);
      if (!(bits & BIT_TAG)) {
        filesID.emplace_back(std::get<0>(snap));
      }
    }
    return true;
  }

  bool DBManager::GetUnClassifyFiles(std::vector<FileID>& filesID)
  {
    std::vector<Snap> vSnaps;
    if (!GetFilesSnap(vSnaps)) return false;
    for (auto& snap : vSnaps) {
      char bits = std::get<2>(snap);
      T_LOG("class", "unclassify file %d: %d", std::get<0>(snap), bits);
      if (!(bits & BIT_CLASS)) {
        filesID.emplace_back(std::get<0>(snap));
      }
    }
    return true;
  }

  bool DBManager::GetTagsOfFiles(const std::vector<FileID>& filesID, std::vector<Tags>& vTags)
  {
    for (auto fileID : filesID) {
      Tags tags;
      GetFileTags(fileID, tags);
      vTags.emplace_back(tags);
    }
    return true;
  }

  bool DBManager::GetClasses(const std::string& parent, nlohmann::json& classes)
  {
    READ_BEGIN(TABLE_CLASS2FILE);
    READ_BEGIN(TABLE_CLASS2HASH);
    std::map<uint32_t, std::vector<FileID>> vFiles;
    uint32_t parentID = 0;
    std::string parentKey(ROOT_CLASS_PATH);
    if (parent != ROOT_CLASS_PATH) {
      std::tie(parentID, parentKey) = EncodePath2Hash(parent);
      T_LOG("class", "panrent: %s, ID: %d, key: %s", parent.c_str(), parentID, format_x16(parentKey).c_str());
    }
    void* pData = nullptr;
    uint32_t len = 0;
    auto children = GetClassChildren(parentKey);
    //std::string sParent = (parent == ROOT_CLASS_PATH ? "" : ROOT_CLASS_PATH);
    for (auto& clsID : children) {
      nlohmann::json jCls;
      std::string name = GetClassByHash(clsID);
      jCls["name"] = name;
      uint32_t childID;
      std::string sChild;
      std::tie(childID, sChild) = EncodePath2Hash(name);
      if (childID == parentID) continue;
      auto clzChildren = GetClassChildren(sChild);
      if (clzChildren.size()) {
        nlohmann::json children;
        for (auto& clzID : clzChildren) {
          nlohmann::json clz;
          clz["id"] = clzID;
          std::string classPath = GetClassByHash(clzID);
          size_t pos = classPath.rfind('/');
          if (pos != std::string::npos) {
            clz["name"] = classPath.substr(pos + 1);
          }
          else {
            clz["name"] = classPath;
          }
          clz["count"] = GetAllFileCountOfClass(clzID);
          clz["type"] = "clz";
          children.push_back(clz);
        }
        jCls["children"] = children;
      }
      jCls["count"] = GetAllFileCountOfClass(childID);
      jCls["type"] = "clz";
      classes.push_back(jCls);
    }
    if (!classes.empty()) {
      T_LOG("class", "parent: %s(%s), get class: %d", parent.c_str(), parentKey.c_str(), classes.dump().c_str());
    }
    return true;
  }

  bool DBManager::getClassesInfo(const std::string& parent, nlohmann::json& info)
  {
    READ_BEGIN(TABLE_CLASS2FILE);
    READ_BEGIN(TABLE_CLASS2HASH);
    std::map<uint32_t, std::vector<FileID>> vFiles;
    uint32_t parentID = 0;
    std::string parentKey(ROOT_CLASS_PATH);
    if (parent != ROOT_CLASS_PATH) {
      std::tie(parentID, parentKey) = EncodePath2Hash(parent);
      T_LOG("class", "panrent: %s, ID: %d, key: %s", parent.c_str(), parentID, format_x16(parentKey).c_str());
    }
    void* pData = nullptr;
    uint32_t len = 0;
    auto children = GetClassChildren(parentKey);
    //std::string sParent = (parent == ROOT_CLASS_PATH ? "" : ROOT_CLASS_PATH);
    for (auto& clsID : children) {
      nlohmann::json jCls;
      std::string name = GetClassByHash(clsID);
      jCls["name"] = name;
      uint32_t childID;
      std::string sChild;
      std::tie(childID, sChild) = EncodePath2Hash(name);
      if (childID == parentID) continue;
      auto clzChildren = GetClassChildren(sChild);
      auto files = GetFilesOfClass(childID);
      T_LOG("class", "clsID:%u, parentID: %u,  %d children %s, files: %s",
        clsID, parentID, childID, format_vector(clzChildren).c_str(), format_vector(files).c_str());
      if (clzChildren.size() || files.size()) {
        nlohmann::json children;
        for (auto& clzID : clzChildren) {
          nlohmann::json clz;
          clz["id"] = clzID;
          std::string classPath = GetClassByHash(clzID);
          size_t pos = classPath.rfind('/');
          if (pos != std::string::npos) {
            clz["name"] = classPath.substr(pos + 1);
          }
          else {
            clz["name"] = classPath;
          }
          clz["count"] = GetAllFileCountOfClass(clzID);
          clz["type"] = "clz";
          children.push_back(clz);
        }
        for (auto& fileID : files) {
          children.push_back(fileID);
        }
        jCls["children"] = children;
      }
      jCls["count"] = GetAllFileCountOfClass(childID);
      jCls["type"] = "clz";
      info.push_back(jCls);
    }
    m_pDatabase->Get(TABLE_CLASS2FILE, parentID, pData, len);
    for (size_t idx = 0; idx < len / sizeof(FileID); ++idx) {
      FileID fid = *((FileID*)pData + idx);
      nlohmann::json jFile;
      jFile["id"] = fid;
      Snap snap = GetFileSnap(fid);
      jFile["name"] = std::get<1>(snap);
      info.push_back(jFile);
    }
    if (!info.empty()) {
      T_LOG("class", "parent: %s(%s), get class: %d", parent.c_str(), parentKey.c_str(), info.dump().c_str());
    }
    return true;
  }

  bool DBManager::GetAllTags(TagTable& tags)
  {
    READ_BEGIN(TABLE_TAG_INDX);
    READ_BEGIN(TABLE_TAG2FILE);

    m_pDatabase->Filter(TABLE_TAG_INDX, [this, &tags](const std::string& alphabet, void* pData, uint32_t len)->bool {
      typedef std::tuple<std::string, std::string, std::vector<FileID>> TagInfo;
      WordIndex* pIndx = (WordIndex*)pData;
      size_t cnt = len / sizeof(WordIndex);
      std::vector<std::string> words = this->GetWordByIndex(pIndx, cnt);
      std::vector<std::vector<FileID>> vFilesID = this->GetFilesIDByTagIndex(pIndx, cnt);
      std::vector<TagInfo> vTags;
      for (size_t idx = 0; idx < words.size(); ++idx) {
        TagInfo tagInfo = std::make_tuple(alphabet, words[idx], vFilesID[idx]);
        vTags.emplace_back(tagInfo);
      }
      tags[alphabet[0]] = vTags;
      return false;
    });
    return true;
  }

  bool DBManager::UpdateFilesClasses(const std::vector<FileID>& filesID, const std::vector<std::string>& classes)
  {
    return this->AddClasses(classes, filesID);
  }

  bool DBManager::UpdateClassName(const std::string& oldName, const std::string& newName)
  {
    std::vector<std::string> vWords = split(newName, '/');
    std::vector<std::string> vOldWords = split(oldName, '/');
    std::vector<std::string> names({ oldName, newName });
    auto mIndexes = m_pDatabase->GetWordsIndex(names);
    std::vector<WordIndex> vIndexes = transform(vWords, mIndexes);
    std::string sNew = serialize(vIndexes);
    T_LOG("class", "sNew: %s", format_x16(sNew).c_str());
    if (IsClassExist(sNew)) return false;
    WRITE_BEGIN();
    auto oldPath = EncodePath2Hash(oldName);
    auto newPath = EncodePath2Hash(newName);
    void* pData = nullptr;
    uint32_t len = 0;
    // remove old
    m_pDatabase->Get(TABLE_KEYWORD2CLASS, mIndexes[vOldWords[vOldWords.size() - 1]], pData, len);
    std::vector<ClassID> vClassesID((ClassID*)pData, (ClassID*)pData + len / sizeof(ClassID));
    m_pDatabase->Del(TABLE_KEYWORD2CLASS, mIndexes[vOldWords[vOldWords.size() - 1]]);
    m_pDatabase->Get(TABLE_CLASS2FILE, oldPath.first, pData, len);
    std::vector<FileID> vFilesID((FileID*)pData, (FileID*)pData + len/sizeof(FileID));
    T_LOG("class", "remove, files: %s words: %s", format_vector(vFilesID).c_str(), format_vector(vOldWords).c_str());
    RemoveKeywords(vFilesID, vOldWords);
    // add new
    m_pDatabase->Put(TABLE_KEYWORD2CLASS, mIndexes[vWords[vWords.size() - 1]], vClassesID.data(), vClassesID.size() * sizeof(ClassID));
    T_LOG("class", "bind, files: %s words: %s", format_vector(vFilesID).c_str(), format_vector(vWords).c_str());
    BindKeywordAndFile(vIndexes, vFilesID);
    // update children class

    T_LOG("class", "update keyword name from %s(%d) to %s(%d), children: %s",
      vOldWords[vOldWords.size() - 1].c_str(), mIndexes[vWords[vWords.size() - 1]],
      vWords[vWords.size() - 1].c_str(), mIndexes[vWords[vWords.size() - 1]],
      format_vector(vClassesID).c_str());

    m_pDatabase->Get(TABLE_HASH2CLASS, oldPath.first, pData, len);
    if (len) {
      T_LOG("class", "updated name %s(%d), len is %d", newName.c_str(), oldPath.first, newName.size());
      m_pDatabase->Put(TABLE_HASH2CLASS, oldPath.first, (void*)newName.data(), newName.size());
    }
    m_pDatabase->Get(TABLE_CLASS2HASH, oldPath.second, pData, len);
    if (len) {
      std::vector<uint32_t> vHash((uint32_t*)pData, (uint32_t*)pData + len / sizeof(uint32_t));
      T_LOG("DEBUG", "key: %s, children: %s", format_x16(newPath.second).c_str(), format_vector(vHash).c_str());
      m_pDatabase->Put(TABLE_CLASS2HASH, newPath.second, vHash.data(), vHash.size() * sizeof(uint32_t));
    }
    UpdateChildrenClassName(oldPath.second, oldName, newName, vOldWords, vIndexes);

    m_pDatabase->Del(TABLE_CLASS2HASH, oldPath.second);
    WRITE_END();
    return true;
  }

  bool DBManager::UpdateFileMeta(const std::vector<FileID>& filesID, const nlohmann::json& mutation)
  {
    WRITE_BEGIN();
    auto existFiles = mapExistFiles(filesID);
    void* pData = nullptr;
    uint32_t len = 0;
    using namespace nlohmann;
    for (FileID fileID : existFiles)
    {
      for (auto itr = mutation.begin(); itr != mutation.end(); ++itr) {
        T_LOG("file", "mutation item[%s]=%s", itr.key().c_str(), itr.value().dump().c_str());
        if (itr.key() == "filename") {
          // if mutaion is filename, update snap
          m_pDatabase->Get(TABLE_FILESNAP, fileID, pData, len);
          std::string s((char*)pData, len);
          T_LOG("file", "mutation snap: %s", s.c_str());
          json jsn = json::parse(s);
          jsn["name"] = itr.value().dump();
          s = to_string(jsn);
          m_pDatabase->Put(TABLE_FILESNAP, fileID, s.data(), s.size());
          // TODO: how to update keyword
        }
        m_pDatabase->Get(TABLE_FILE_META, fileID, pData, len);
        std::vector<uint8_t> sMeta((uint8_t*)pData, (uint8_t*)pData + len);
        json meta = json::from_cbor(sMeta);
        //T_LOG("file", "mutation meta: %s", meta.dump().c_str());
        for (auto& m : meta) {
          if (m["name"] == itr.key()) {
            m["value"] = itr.value();
            break;
          }
        }
        sMeta = json::to_cbor(meta);
        m_pDatabase->Put(TABLE_FILE_META, fileID, sMeta.data(), sMeta.size());
      }
    }
    WRITE_END();
    return true;
  }

  bool DBManager::Query(const std::string& query, std::vector<FileInfo>& filesInfo)
  {
    namespace pegtl = TAO_PEGTL_NAMESPACE;
    pegtl::memory_input input(query, "");
    T_LOG("query", "sql: %s", query.c_str());
    auto root = pegtl::parse_tree::parse<caxios::QueryGrammar, caxios::query_selector>(input);
    RPN rpn(std::move(root));
    //rpn.debug();
    T_LOG("query", "rpn generate finish");
    std::stack<std::unique_ptr<ISymbol>> sSymbol;
    for (auto itr = rpn.begin(); itr != rpn.end(); ++itr)
    {
      switch ((*itr)->symbolType())
      {
      case Table:
        sSymbol.emplace(std::move(*itr));
        break;
      case Condition:
        sSymbol.emplace(std::move(*itr));
        break;
      case Expression:
      {
        // pop stack
        T_LOG("query", "IExpression: %s", (*itr)->Value().c_str());
        std::unique_ptr<IExpression> pExpr = dynamic_unique_cast<IExpression>(std::move(*itr));
        if (pExpr->Value() == OP_In) { // array
          std::unique_ptr<ValueArray> pArray(new ValueArray);
          int loop = (pExpr->statementCount() == 0 ? sSymbol.size() : pExpr->statementCount());
          for (int idx =0; idx< loop; ++idx)
          {
            std::unique_ptr<ISymbol> pRight = std::move(sSymbol.top());
            sSymbol.pop();
            std::unique_ptr< ValueInstance > pValue = dynamic_unique_cast<ValueInstance>(std::move(pRight));
            pArray->push(pValue);
          }
          sSymbol.emplace(std::move(pArray));
          T_LOG("query", "array count: %d", sSymbol.size());
        }
        else {
          T_LOG("query", "stack count: %d", sSymbol.size());
          std::unique_ptr<ISymbol> pLeft = std::move(sSymbol.top());
          sSymbol.pop();
          std::unique_ptr<ISymbol> pRight = std::move(sSymbol.top());
          std::unique_ptr< ValueInstance > pValue = dynamic_unique_cast<ValueInstance>(std::move(pRight));
          sSymbol.pop();
          if (pLeft->symbolType() == Table) {
            std::unique_ptr<ITableProxy> pLeftValue = dynamic_unique_cast<ITableProxy>(std::move(pLeft));
            auto result = caxios::Query(m_pDatabase, std::move(pExpr), std::move(pLeftValue), std::move(pValue));
            sSymbol.emplace(std::move(result));
          }
          else {
            std::unique_ptr<ValueInstance> pLeftValue = dynamic_unique_cast<ValueInstance>(std::move(pLeft));
            auto result = caxios::Query(m_pDatabase, std::move(pExpr), std::move(pLeftValue), std::move(pValue));
            sSymbol.emplace(std::move(result));
          }
        }
      }
        break;
      default:
        break;
      }
    }
    T_LOG("query", "result count: %d", sSymbol.size());
    if (sSymbol.size() == 0) return false;
    auto result = std::move(sSymbol.top());
    std::unique_ptr<ValueArray> array = dynamic_unique_cast<ValueArray>(std::move(result));
    return GetFilesInfo(array->GetArray<FileID>(), filesInfo);
  }

  bool DBManager::ValidVersion()
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_SCHEMA, (uint32_t)SCHEMA_INFO::Version, pData, len);
    if (len == 0) {
      char dbvs = SCHEMA_VERSION;
      m_pDatabase->Put(TABLE_SCHEMA, (uint32_t)SCHEMA_INFO::Version, &dbvs, sizeof(char));
      return true;
    }
    char* pV = (char*)pData;
    if (*pV == SCHEMA_VERSION) return true;
    return false;
  }

  void DBManager::InitDB(CDatabase*& pDB, const char* dir, const char* name, size_t size)
  {
    T_LOG("init", "max db size: %d", size);
    if (pDB == nullptr) {
      pDB = new CDatabase(dir, name, _flag, size);
    }
    if (pDB == nullptr) {
      std::cerr << "new CDatabase fail.\n";
      return;
    }
  }

  bool DBManager::AddFile(FileID fileid, const MetaItems& meta, const Keywords& keywords)
  {
    using namespace nlohmann;
    json dbMeta;
    dbMeta = meta;
    std::string value = to_string(dbMeta);
    T_LOG("file", "Write ID: %d, Meta Info: %s", fileid, value.c_str());
    auto vData = json::to_cbor(dbMeta);
    if (!m_pDatabase->Put(TABLE_FILE_META, fileid, (void*)(&vData[0]), vData.size())) {
      return false;
    }
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
    if (!m_pDatabase->Put(TABLE_FILESNAP, fileid, (void*)(sSnaps.data()), sSnaps.size())) {
      T_LOG("file", "Put TABLE_FILESNAP Fail %s", sSnaps.c_str());
      return false;
    }
    T_LOG("file", "Write Snap: %s", sSnaps.c_str());
    // meta
    for (MetaItem m : meta) {
      std::string& name = m["name"];
      auto pTable = m_pDatabase->GetMetaTable(name);
      if (!pTable) continue;
      std::vector<FileID> vID;
      vID.emplace_back(fileid);
      T_LOG("file", "add meta(%s): %s, %d", name.c_str(), m["value"].c_str(), fileid);
      pTable->Add(m["value"], vID);
    }
    // counts
    SetSnapStep(fileid, BIT_INIT_OFFSET);
    // keyword
    return true;
  }

  bool DBManager::AddFileID2Tag(const std::vector<FileID>& vFilesID, WordIndex index)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    std::vector<FileID> vID;
    m_pDatabase->Get(TABLE_TAG2FILE, index, pData, len);
    if (len) {
      std::vector<FileID> vTemp((FileID*)pData, (FileID*)pData + len/sizeof(FileID));
      addUniqueDataAndSort(vID, vTemp);
    }
    addUniqueDataAndSort(vID, vFilesID);
    m_pDatabase->Put(TABLE_TAG2FILE, index, (void*)vID.data(), vID.size() * sizeof(FileID));
    return true;
  }

  bool DBManager::AddFileID2Keyword(FileID fileID, WordIndex keyword)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_KEYWORD2FILE, keyword, pData, len);
    FileID* pIDs = (FileID*)pData;
    size_t cnt = len / sizeof(FileID);
    std::vector<FileID> vFilesID(pIDs, pIDs + cnt);
    if (addUniqueDataAndSort(vFilesID, fileID)) return true;
    T_LOG("keyword", "add fileID: %d, keyword: %d, current: %s", fileID, keyword, format_vector(vFilesID).c_str());
    if (!m_pDatabase->Put(TABLE_KEYWORD2FILE, keyword, &(vFilesID[0]), sizeof(FileID) * vFilesID.size())) return false;
    return true;
  }

  void DBManager::UpdateChildrenClassName(const std::string& clssKey, const std::string& oldParentName, const std::string& newParentName,
    const std::vector<std::string>& oldStrings, const std::vector<WordIndex>& vWordsIndex)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    auto children = GetClassChildren(clssKey);
    for (ClassID cid : children) {
      m_pDatabase->Get(TABLE_HASH2CLASS, cid, pData, len);
      if (len) {
        std::string oldPath((char*)pData, (char*)pData + len);
        std::string clsName = oldPath;
        auto start = clsName.begin();
        clsName.replace(start, start + oldParentName.size(), newParentName);
        m_pDatabase->Put(TABLE_HASH2CLASS, cid, (void*)clsName.data(), clsName.size());
        // Update hash key -> class
        auto newKey = GetClassKey(cid);
        T_LOG("class", "updated name %s(%d) %s,  len is %d", clsName.c_str(), cid, format_x16(newKey).c_str(), clsName.size());
        UpdateChildrenClassName(oldPath, oldParentName, newParentName,oldStrings, vWordsIndex);
        // bind class hash 2 key
        auto oldKey = GetClassKey(oldPath);
        m_pDatabase->Get(TABLE_CLASS2HASH, oldKey, pData, len);
        m_pDatabase->Put(TABLE_CLASS2HASH, newKey, pData, len);
        m_pDatabase->Del(TABLE_CLASS2HASH, oldKey);
      }
      m_pDatabase->Get(TABLE_CLASS2FILE, cid, pData, len);
      std::vector<FileID> vFiles((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
      RemoveKeywords(vFiles, oldStrings);
      BindKeywordAndFile(vWordsIndex, vFiles);
    }
  }

  bool DBManager::AddKeyword2File(WordIndex keyword, FileID fileID)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_FILE2KEYWORD, fileID, pData, len);
    T_LOG("keyword", "add keyword Index: %d, len: %d", keyword, len);
    WordRef wref = { keyword , 1 };
    WordRef* pWords = (WordRef*)pData;
    size_t cnt = len / sizeof(WordRef);
    std::vector<WordRef> vWordIndx(pWords, pWords + cnt);
    if (addUniqueDataAndSort(vWordIndx, wref)) return true;
    T_LOG("keyword", "add keywords: %d, fileID: %d", keyword, fileID);
    if (!m_pDatabase->Put(TABLE_FILE2KEYWORD, fileID, &(vWordIndx[0]), sizeof(WordRef) * vWordIndx.size())) return false;
    return true;
  }

  void DBManager::BindKeywordAndFile(WordIndex wid, FileID fid)
  {
      this->AddKeyword2File(wid, fid);
      this->AddFileID2Keyword(fid, wid);
  }

  void DBManager::BindKeywordAndFile(const std::vector<WordIndex>& mIndexes, const std::vector<FileID>& existID)
  {
    for (auto fid : existID) {
      for (auto& item : mIndexes) {
        BindKeywordAndFile(item, fid);
      }
    }
  }

  bool DBManager::AddTagPY(const std::string& tag, WordIndex indx)
  {
    T_LOG("tag", "input py: %s", tag.c_str());
    std::wstring wTag = string2wstring(tag);
    T_LOG("tag", "input wpy: %ls, %d", wTag.c_str(), wTag[0]);
    auto py = getLocaleAlphabet(wTag[0]);
    T_LOG("tag", "Pinyin: %ls -> %ls", wTag.c_str(), py[0].c_str());
    WRITE_BEGIN();
    std::set<WordIndex> sIndx;
    void* pData = nullptr;
    uint32_t len = 0;
    if (m_pDatabase->Get(TABLE_TAG_INDX, py[0], pData, len)) {
      WordIndex* pWords = (WordIndex*)pData;
      size_t cnt = len / sizeof(WordIndex);
      sIndx = std::set<WordIndex>(pWords, pWords + cnt);
    }
    sIndx.insert(indx);
    std::vector< WordIndex> vIndx(sIndx.begin(), sIndx.end());
    m_pDatabase->Put(TABLE_TAG_INDX, py[0], vIndx.data(), vIndx.size() * sizeof(WordIndex));
    WRITE_END();
    return true;
  }

  bool DBManager::AddClass2FileID(uint32_t key, const std::vector<FileID>& vFilesID)
  {
    std::vector<FileID> vFiles(vFilesID);
    //std::sort(vFiles.begin(), vFiles.end());
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_CLASS2FILE, key, pData, len);
    std::vector<FileID> vID;
    if (len) {
      vID.assign((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
    }
    addUniqueDataAndSort(vID, vFilesID);
    T_LOG("class", "add files to class %d: %s", key, format_vector(vID).c_str());
    m_pDatabase->Put(TABLE_CLASS2FILE, key, (void*)vID.data(), vID.size() * sizeof(FileID));
    return true;
  }

  bool DBManager::AddFileID2Class(const std::vector<FileID>& filesID, uint32_t clsID)
  {
    for (auto fileID : filesID) {
      void* pData = nullptr;
      uint32_t len = 0;
      m_pDatabase->Get(TABLE_FILE2CLASS, fileID, pData, len);
      std::vector<uint32_t> vClasses;
      if (len) {
        vClasses.assign((uint32_t*)pData, (uint32_t*)pData + len / sizeof(uint32_t));
      }
      addUniqueDataAndSort(vClasses, clsID);
      T_LOG(TABLE_FILE2CLASS, "add class to file, fileID: %u, class: %s, new class: %u", fileID, format_vector(vClasses).c_str(), clsID);
      m_pDatabase->Put(TABLE_FILE2CLASS, fileID, vClasses.data(), vClasses.size()*sizeof(uint32_t));
    }
    return true;
  }

  void DBManager::MapHash2Class(uint32_t clsID, const std::string& name)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_HASH2CLASS, clsID, pData, len);
    if (len == 0) {
      m_pDatabase->Put(TABLE_HASH2CLASS, clsID, (void*)name.data(), name.size());
    }
  }

  std::vector<uint32_t> DBManager::AddClassImpl(const std::vector<std::string>& classes)
  {
    std::vector<uint32_t> vClasses;
    auto mIndexes = m_pDatabase->GetWordsIndex(classes);
    for (auto& clazz : classes) {
      std::vector<std::string> vTokens = split(clazz, '/');
      std::vector<WordIndex> vClassPath;
      std::for_each(vTokens.begin(), vTokens.end(), [&mIndexes, &vClassPath](const std::string& token) {
        T_LOG("class", "class token: %s, %d", token.c_str(), mIndexes[token]);
        vClassPath.emplace_back(mIndexes[token]);
      });
      std::string sChild = serialize(vClassPath);
      T_LOG("class", "serialize result: %s", format_x16(sChild).c_str());
      ClassID child = GenerateClassHash(sChild);
      if (child == 0) {
        T_LOG("class", "error: %s", clazz.c_str());
        continue;
      }
      vClasses.emplace_back(child);
      MapHash2Class(child, clazz);
      uint32_t parent = ROOT_CLASS_ID;
      std::string sParent(ROOT_CLASS_PATH);
      void* pData = nullptr;
      uint32_t len = 0;
      for (auto& clsPath : vClassPath) {
        // add word map to class hash
        m_pDatabase->Get(TABLE_KEYWORD2CLASS, clsPath, pData, len);
        std::vector<ClassID> vClassesID((ClassID*)pData, (ClassID*)pData + len / sizeof(ClassID));
        addUniqueDataAndSort(vClassesID, child);
        m_pDatabase->Put(TABLE_KEYWORD2CLASS, clsPath, vClassesID.data(), vClassesID.size() * sizeof(ClassID));
        T_LOG("class", "add keyword %s(%d) map to %s ", clazz.c_str(), clsPath, format_vector(vClassesID).c_str());
      }
      if (vClassPath.size() > 0) {
        vClassPath.pop_back();
        if (vClassPath.size() != 0) {
          sParent = serialize(vClassPath);
          parent = GenerateClassHash(sParent);
        }
        T_LOG("class", "parent(%llu): %s, %u", vClassPath.size(),(sParent).c_str(), parent);
      }
      // update parent 
      m_pDatabase->Get(TABLE_CLASS2HASH, sChild, pData, len);
      if (len == 0) {
        // add . and ..
        InitClass(sChild, child, parent);
        T_LOG("class", "add class [%s] to hash [%u(%s), %u]", format_x16(sChild).c_str(), child, clazz.c_str(), parent);
      }
      else {
        std::vector<ClassID> cIDs((ClassID*)pData, (ClassID*)pData + len / sizeof(ClassID));
        T_LOG("class", "class children: %s", format_vector(cIDs).c_str());
      }
      m_pDatabase->Get(TABLE_CLASS2HASH, sParent, pData, len);
      std::vector<uint32_t> children(len + 1);
      if (len) {
        children.assign((uint32_t*)pData + CHILD_START_OFFSET, (uint32_t*)pData + len / sizeof(uint32_t));
      }
      addUniqueDataAndSort(children, child);
      if (len) {
        children.insert(children.begin(), (uint32_t*)pData, (uint32_t*)pData + CHILD_START_OFFSET);
      }
      T_LOG("class", "add class to class, parent: %s(%d), current: %d, name: %s(%s), children: %s",
        format_x16(sParent).c_str(), parent, child, clazz.c_str(), format_x16(sChild).c_str(), format_vector(children).c_str());
      T_LOG("DEBUG", "TABLE_CLASS2HASH, key: %s, children: %s", format_x16(sParent).c_str(), format_vector(children).c_str());
      m_pDatabase->Put(TABLE_CLASS2HASH, sParent, children.data(), children.size() * sizeof(uint32_t));
      
    }
    return std::move(vClasses);
  }

  void DBManager::InitClass(const std::string& key, uint32_t curClass, uint32_t parent)
  {
    // add . and ..
    std::vector<uint32_t> vCurrent({ curClass , parent });
    T_LOG("DEBUG", "TABLE_CLASS2HASH, key: %s, children: %s", format_x16(key).c_str(), format_vector(vCurrent).c_str());
    m_pDatabase->Put(TABLE_CLASS2HASH, key, vCurrent.data(), vCurrent.size() * sizeof(uint32_t));
  }

  bool DBManager::RemoveFile(FileID fileID)
  {
    using namespace nlohmann;
    //
    void* pData = nullptr;
    uint32_t len = 0;
    if (!m_pDatabase->Get(TABLE_FILE_META, fileID, pData, len)) {
      T_LOG("file", "GET TABLE_FILE_META Fail %d", fileID);
      return false;
    }
    if (len != 0) {
      T_LOG("file", "meta size: %d", len);
      std::vector<uint8_t> info((uint8_t*)pData, (uint8_t*)pData + len);
      json meta = json::from_cbor(info);
      //T_LOG("file", "file meta(%d): %s", len, meta.dump().c_str());
      // meta
      for (json::iterator itr = meta.begin(); itr != meta.end(); ++itr) {
        std::string name = (*itr)["name"];
        auto pTable = m_pDatabase->GetMetaTable(name);
        if (!pTable) continue;
        auto value = (*itr)["value"];
        if (value.is_array()) {
          for (auto item : value) {
            pTable->Delete(item, fileID);
          }
        }
        else {
          pTable->Delete(value, fileID);
        }
      }
    }
    // tag
    RemoveFile(fileID, TABLE_FILE2TAG, TABLE_TAG2FILE);
    // class
    RemoveFile(fileID, TABLE_FILE2CLASS, TABLE_CLASS2FILE);
    // snap
    m_pDatabase->Del(TABLE_FILESNAP, fileID);
    m_pDatabase->Del(TABLE_FILE_META, fileID);
    // TODO: keyword match files
    RemoveFileIDFromKeyword(fileID);
    // TODO: 回收键值
    return true;
  }

  void DBManager::RemoveFile(FileID fileID, const std::string& file2type, const std::string& type2file)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(file2type, fileID, pData, len);
    std::vector<WordIndex> vTypesID((WordIndex*)pData, (WordIndex*)pData + len / sizeof(WordIndex));
    for (auto typeID : vTypesID)
    {
      m_pDatabase->Get(type2file, typeID, pData, len);
      std::vector<FileID> vFiles((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
      eraseData(vFiles, fileID);
      m_pDatabase->Put(type2file, typeID, vFiles.data(), vFiles.size() * sizeof(FileID));
    }
    T_LOG("file", "remove file: %d", fileID);
    m_pDatabase->Del(file2type, fileID);
  }

  bool DBManager::RemoveTag(FileID fileID, const Tags& tags)
  {
    READ_BEGIN(TABLE_FILE2TAG);
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_FILE2TAG, fileID, pData, len);
    if (len == 0) return true;
    auto indexes = m_pDatabase->GetWordsIndex(tags);
    WordIndex* pWordIndx = (WordIndex*)pData;
    size_t cnt = len / sizeof(WordIndex);
    for (auto& item : indexes)
      for (size_t idx = 0; idx < cnt; ++idx) {
      {
        if (pWordIndx[idx] == item.second) {
          pWordIndx[idx] = 0;
          break;
        }
      }
    }
    m_pDatabase->Put(TABLE_FILE2TAG, fileID, pData, len);
    return true;
  }

  bool DBManager::RemoveClassImpl(const std::string& classPath)
  {
    if (classPath == "/") return false;
    ClassID clsID = ROOT_CLASS_ID;
    std::string clsKey(ROOT_CLASS_PATH);
    std::vector<std::string> vWords;
    auto vW = split(classPath, '/');
    addUniqueDataAndSort(vWords, vW);
    auto mIndexes = m_pDatabase->GetWordsIndex(vWords);
    std::vector<WordIndex> vIndexes = transform(vW, mIndexes);
    clsKey = serialize(vIndexes);
    clsID = GetClassHash(clsKey);
    T_LOG("class", "trace  classID: %d, key: %s", clsID, format_x16(clsKey).c_str());
    auto children = GetClassChildren(clsKey); // use TABLE_CLASS2HASH
    for (auto child : children) {
      if (child == clsID) continue;
      std::string clsPath = GetClassByHash(child);
      T_LOG("DEBUG", "children: %s, %d", clsPath.c_str(), child);
      RemoveClassImpl(clsPath);
    }
    // children is empty now, DEL it
    // clean: TABLE_KEYWORD2CLASS, TABLE_HASH2CLASS, TABLE_CLASS2HASH, TABLE_FILE2CLASS, TABLE_CLASS2FILE,
    // 1. clean TABLE_FILE2CLASS
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_CLASS2FILE, clsID, pData, len);
    if (len) {
      std::vector<FileID> vFilesID((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
      // remove file to class
      for (FileID fid : vFilesID) {
        m_pDatabase->Get(TABLE_FILE2CLASS, fid, pData, len);
        if (len) {
          std::vector<ClassID> vSrcID((ClassID*)pData, (ClassID*)pData + len / sizeof(ClassID));
          eraseData(vSrcID, clsID);
          m_pDatabase->Put(TABLE_FILE2CLASS, fid, vSrcID.data(), vSrcID.size() * sizeof(ClassID));
        }
      }
    }
    //T_LOG("class", "assert %s, %d", classPath.c_str(), clsID);
    //assert(classPath != "/" && clsID != 0);
    T_LOG("class", "remove %s(%d, %s)", classPath.c_str(), clsID, format_x16(clsKey).c_str());
    // remove it from parent: TABLE_CLASS2HASH
    ClassID parentID = GetClassParent(clsKey);
    auto parentKey = GetClassKey(parentID);
    m_pDatabase->Get(TABLE_CLASS2HASH, parentKey, pData, len);
    if (len > CHILD_START_OFFSET * sizeof(ClassID)) {
      std::vector<ClassID> parentChildren((ClassID*)pData + CHILD_START_OFFSET, (ClassID*)pData + len / sizeof(ClassID));
      T_LOG("class", "remove %d from parent %d(%s), children: %s ", clsID, parentID, parentKey.c_str(), format_vector(parentChildren).c_str());
      eraseData(parentChildren, clsID);
      parentChildren.insert(parentChildren.begin(), (ClassID*)pData, (ClassID*)pData + CHILD_START_OFFSET);
      T_LOG("DEBUG", "TABLE_CLASS2HASH, key: %s, children: %s", format_x16(parentKey).c_str(), format_vector(parentChildren).c_str());
      m_pDatabase->Put(TABLE_CLASS2HASH, parentKey, parentChildren.data(), parentChildren.size() * sizeof(ClassID));
    }
    // 2. clean TABLE_CLASS2FILE
    m_pDatabase->Del(TABLE_CLASS2FILE, clsID);
    // 3. clean TABLE_HASH2CLASS
    m_pDatabase->Del(TABLE_HASH2CLASS, clsID);
    // 4. clean TABLE_CLASS2HASH
    m_pDatabase->Del(TABLE_CLASS2HASH, clsKey);
    // 5. TODO: clean TABLE_KEYWORD2CLASS
    
    // TODO: remove keyword but same tag how to process?
    return true;
  }

  bool DBManager::RemoveKeywords(const std::vector<FileID>& filesID, const std::vector<std::string>& keyword)
  {
    auto mIndexes = m_pDatabase->GetWordsIndex(keyword);
    std::vector<WordIndex> vWordsIndx;
    std::for_each(mIndexes.begin(), mIndexes.end(), [&vWordsIndx](auto& item) {
      vWordsIndx.emplace_back(item.second);
    });
    std::map<WordIndex, std::vector<FileID>> mRemovedFiles;
    void* pData = nullptr;
    uint32_t len = 0;
    for (FileID fileID : filesID) {
      m_pDatabase->Get(TABLE_FILE2KEYWORD, fileID, pData, len);
      std::vector<WordRef> vWords((WordRef*)pData, (WordRef*)pData + len / sizeof(WordRef));
      if (vWords.size() == 0) continue;
      std::vector<WordIndex> removedWords = eraseData(vWords, vWordsIndx);
      m_pDatabase->Put(TABLE_FILE2KEYWORD, fileID, vWords.data(), vWords.size() * sizeof(WordIndex));
      for (auto indx: removedWords)
      {
        addUniqueDataAndSort(mRemovedFiles[indx], fileID);
      }
    }
    for (auto& item : mRemovedFiles)
    {
      m_pDatabase->Get(TABLE_KEYWORD2FILE, item.first, pData, len);
      if (len) {
        std::vector<FileID> vFsID((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
        eraseData(vFsID, item.second);
        m_pDatabase->Put(TABLE_KEYWORD2FILE, item.first, vFsID.data(), vFsID.size() * sizeof(FileID));
      }
    }
    return true;
  }

  bool DBManager::RemoveFileIDFromKeyword(FileID fileID)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_FILE2KEYWORD, fileID, pData, len);
    if (len) {
      std::vector<WordRef> vIndexes((WordRef*)pData, (WordRef*)pData + len/sizeof(WordRef));
      T_LOG("file", "indexes count: %u", vIndexes.size());
      for (auto ref: vIndexes)
      {
        m_pDatabase->Get(TABLE_KEYWORD2FILE, word_policy<WordRef>::id(ref), pData, len);
        if (len) {
          std::vector<FileID> vFilesID((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
          eraseData(vFilesID, fileID);
          T_LOG("file", "remove %d result: %s", fileID, format_vector(vFilesID).c_str());
          m_pDatabase->Put(TABLE_KEYWORD2FILE, word_policy<WordRef>::id(ref), vFilesID.data(), vFilesID.size() * sizeof(FileID));
        }
      }
    }
    return true;
  }

  bool DBManager::GetFileInfo(FileID fileID, MetaItems& meta, Keywords& keywords, Tags& tags, Annotations& anno)
  {
    // meta
    return true;
  }

  bool DBManager::GetFileTags(FileID fileID, Tags& tags)
  {
    READ_BEGIN(TABLE_FILE2TAG);
    void* pData = nullptr;
    uint32_t len = 0;
    if (!m_pDatabase->Get(TABLE_FILE2TAG, fileID, pData, len)) return true;
    WordIndex* pWordIndx = (WordIndex*)pData;
    size_t cnt = len / sizeof(WordIndex);
    tags = GetWordByIndex(pWordIndx, cnt);
    return true;
  }

  std::vector<caxios::FileID> DBManager::GetFilesByClass(const std::vector<WordIndex>& clazz)
  {
    std::vector<caxios::FileID> vFilesID;
    std::string sPath = serialize(clazz);
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_CLASS2FILE, sPath, pData, len);
    if (len == 0) {
      T_LOG("file", "get files by class error: %s", format_vector(clazz).c_str());
    }
    else {
      vFilesID.assign((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
    }
    return std::move(vFilesID);
  }

  bool DBManager::IsFileExist(FileID fileID)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_FILESNAP, fileID, pData, len);
    if (len > 0) return true;
    return false;
  }

  bool DBManager::IsClassExist(const std::string& clazz)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_CLASS2HASH, clazz, pData, len);
    if (len == 0) return false;
    return true;
  }

  uint32_t DBManager::GenerateClassHash(const std::string& clazz)
  {
    if (IsClassExist(clazz)) return GetClassHash(clazz);
    auto e = encode(clazz);
    uint32_t offset = 1;
    do {
      void* pData = nullptr;
      uint32_t len = 0;
      m_pDatabase->Get(TABLE_HASH2CLASS, e, pData, len);
      if (len == 0) {
        break;
      }
      e = createHash(e, offset);
    } while (++offset);
    T_LOG("class", "hash: %u", e);
    return e;
  }

  ClassID DBManager::GetClassHash(const std::string& clazz)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_CLASS2HASH, clazz, pData, len);
    if (len == 0) return 0;
    return *(ClassID*)pData;
  }

  uint32_t DBManager::GetClassParent(const std::string& clazz)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    if (!m_pDatabase->Get(TABLE_CLASS2HASH, clazz, pData, len)) return 0;
    return *((uint32_t*)pData+1);
  }

  std::pair<uint32_t, std::string> DBManager::EncodePath2Hash(const std::string& classPath)
  {
    if (classPath == "/") return std::pair<uint32_t, std::string>({ ROOT_CLASS_ID, ROOT_CLASS_PATH });
    std::vector<std::string> vWords = split(classPath, '/');
    auto mIndexes = m_pDatabase->GetWordsIndex(vWords);
    std::vector<WordIndex> vIndexes = transform(vWords, mIndexes);
    std::string sKey = serialize(vIndexes);
    uint32_t hash = GenerateClassHash(sKey);
    T_LOG("class", "encode path: %s to (%u, %s)", classPath.c_str(), hash, format_x16(sKey).c_str());
    return std::make_pair(hash, sKey);
  }

  std::vector<ClassID> DBManager::GetClassChildren(const std::string& clazz)
  {
    std::vector<ClassID> vChildren;
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_CLASS2HASH, clazz, pData, len);
    size_t cnt = len / sizeof(ClassID);
    if (cnt > CHILD_START_OFFSET) {
      T_LOG("class", "%s children count: %d", clazz.c_str(), cnt);
      vChildren.assign((ClassID*)pData + CHILD_START_OFFSET, (ClassID*)pData + cnt);
    }
    T_LOG("class", "%s children: %s", clazz.c_str(), format_vector(vChildren).c_str());
    return std::move(vChildren);
  }

  std::string DBManager::GetClassByHash(uint32_t hs)
  {
    std::string cls(ROOT_CLASS_PATH);
    if (hs != 0) {
      void* pData = nullptr;
      uint32_t len = 0;
      m_pDatabase->Get(TABLE_HASH2CLASS, hs, pData, len);
      if (len) {
        cls.assign((char*)pData, (char*)pData + len);
      }
    }
    return std::move(cls);
  }

  std::string DBManager::GetClassKey(ClassID hs)
  {
    std::string str = GetClassByHash(hs);
    return GetClassKey(str);
  }

  std::string DBManager::GetClassKey(const std::string& clsPath)
  {
    if (clsPath == "/") return clsPath;
    auto vWords = split(clsPath, '/');
    auto token = m_pDatabase->GetWordsIndex(vWords);
    std::vector<WordIndex> vIndexes = transform(vWords, token);
    return serialize(vIndexes);
  }

  std::vector<caxios::FileID> DBManager::GetFilesOfClass(uint32_t clsID)
  {
    std::vector<caxios::FileID> vFilesID;
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_CLASS2FILE, clsID, pData, len);
    for (size_t idx = 0; idx < len / sizeof(FileID); ++idx) {
      FileID fid = *((FileID*)pData + idx);
      vFilesID.push_back(fid);
    }
    m_pDatabase->Filter(TABLE_CLASS2FILE, [](uint32_t k, void* pData, uint32_t len)->bool {
      std::vector<FileID> vFiles((FileID*)pData,(FileID*)pData + len/sizeof(FileID));
      T_LOG("class", "view result: %u, %s", k, format_vector(vFiles).c_str());
      return false;
      });
    return vFilesID;
  }

  std::vector<caxios::FileID> DBManager::mapExistFiles(const std::vector<FileID>& filesID)
  {
    std::vector<caxios::FileID> vFiles;
    for (auto fileID : filesID) {
      void* pData = nullptr;
      uint32_t len = 0;
      m_pDatabase->Get(TABLE_FILE_META, fileID, pData, len);
      if (len) {
        vFiles.emplace_back(fileID);
      }
    }
    return std::move(vFiles);
  }

  void DBManager::ParseMeta(const std::string& meta)
  {
    nlohmann::json jsn = nlohmann::json::parse(meta);
    for (auto item : jsn)
    {
      //T_LOG("query", "schema item: %s", item.dump().c_str());
      if (item["query"] == true) {
        std::string name = trunc(item["name"].dump());
        m_pDatabase->GetOrCreateMetaTable(name, trunc(item["type"].dump()));
        T_LOG("query", "schema[%s]: %s", name.c_str(), item["name"].dump().c_str());
      }
    }
    T_LOG("construct", "schema: %s", meta.c_str());
  }

  void DBManager::SetSnapStep(FileID fileID, int offset, bool bSet)
  {
    nlohmann::json jSnap;
    int step = GetSnapStep(fileID, jSnap);
    bool bs = step & (1 << offset);
    T_LOG("snap", "step: %d, offset: %d, result: %d", step, offset, bs);
    if (bs == bSet) return;
    if (bSet) {
      step |= (1 << offset);
    }
    else {
      step &= ~(1 << offset);
    }
    jSnap["step"] = step;
    std::string snap = jSnap.dump();
    T_LOG("snap", "put snap value: file %d, %d, bit %d", fileID, step, offset);
    m_pDatabase->Put(TABLE_FILESNAP, fileID, (void*)snap.data(), snap.size());
  }

  char DBManager::GetSnapStep(FileID fileID, nlohmann::json& jSnap)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_FILESNAP, fileID, pData, len);
    if (len == 0) return 0;
    std::string snap((char*)pData, len);
    T_LOG("snap", "snap: %s", snap.c_str());
    jSnap = nlohmann::json::parse(snap);
    int step = atoi(jSnap["step"].dump().c_str());
    return step;
  }

  Snap DBManager::GetFileSnap(FileID fileID)
  {
    Snap snap;
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(TABLE_FILESNAP, fileID, pData, len);
    if (len) {
      std::string js((char*)pData, len);
      nlohmann::json jSnap = nlohmann::json::parse(js);
      std::get<2>(snap) = atoi(jSnap["step"].dump().c_str());
      std::get<0>(snap) = fileID;
      std::get<1>(snap) = trunc(jSnap["value"].dump());
    }
    return std::move(snap);
  }

  WordIndex DBManager::GetWordIndex(const std::string& word)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    if (!m_pDatabase->Get(TABLE_KEYWORD_INDX, word, pData, len)) return 0;
    return *(WordIndex*)pData;
  }

  std::vector<std::vector<FileID>> DBManager::GetFilesIDByTagIndex(const WordIndex* const wordsIndx, size_t cnt)
  {
    std::vector<std::vector<FileID>> vFilesID;
    for (size_t idx = 0; idx < cnt; ++idx) {
      WordIndex wordIdx = wordsIndx[idx];
      void* pData = nullptr;
      uint32_t len = 0;
      if(!m_pDatabase->Get(TABLE_TAG2FILE, wordIdx, pData, len)) continue;
      FileID* pFileID = (FileID*)pData;
      std::vector<FileID> filesID(pFileID, pFileID + len / sizeof(FileID));
      vFilesID.emplace_back(filesID);
    }
    return std::move(vFilesID);
  }

}