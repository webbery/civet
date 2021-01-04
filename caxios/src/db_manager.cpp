#include "db_manager.h"
#include <iostream>
#include "log.h"
#include "util/util.h"
#include "table/TableMeta.h"
#include <set>
#include <utility>
#include <deque>
#include "util/pinyin.h"
#include "QueryAction.h"

#define READ_BEGIN(dbname) \
  if (m_mDBs[dbname] == -1) {\
    m_mDBs[dbname] = m_pDatabase->OpenDatabase(dbname);\
    T_LOG("manager", "OpenDatabase: %s, DBI: %d", dbname, m_mDBs[dbname]);\
    if (m_mDBs[dbname] == -1) return false;\
  }

#define WRITE_BEGIN()  m_pDatabase->Begin()
#define WRITE_END()    m_pDatabase->Commit()

#define BIT_INIT_OFFSET  0
#define BIT_TAG_OFFSET   1
#define BIT_CLASS_OFFSET 2
#define BIT_TAG     (1<<BIT_TAG_OFFSET)
#define BIT_CLASS   (1<<BIT_CLASS_OFFSET)
//#define BIT_ANNO  (1<<3)

namespace caxios {
  const char* g_tables[] = {
    TABLE_SCHEMA,
    TABLE_FILESNAP,
    TABLE_FILE_META,
    TABLE_KEYWORD_INDX,
    TABLE_INDX_KEYWORD,
    TABLE_KEYWORD2FILE,
    TABLE_FILE2KEYWORD,
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
    // init map
    InitMap();
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
    // 检查数据库版本是否匹配, 如果不匹配, 则开启线程，将当前数据库copy一份，进行升级, 并同步后续的所有写操作

    // 如果期间程序退出中断, 记录中断点, 下次启动时继续 
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
        T_LOG("generate", "val: %u, L: %u, %d", lastID, len, sizeof(uint32_t));
      }
    }
    for (int idx = 0; idx < cnt; ++idx) {
      lastID += 1;
      filesID.emplace_back(lastID);
    }
    WRITE_BEGIN();
    if (!m_pDatabase->Put(m_mDBs[TABLE_FILESNAP], 0, &lastID, sizeof(FileID))) {
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
    auto mIndexes = GetWordsIndex(classes);
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
        this->AddKeyword2File(item.second, fid);
        this->AddFileID2Keyword(item.second, fid);
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

  bool DBManager::RemoveFiles(const std::vector<FileID>& filesID)
  {
    WRITE_BEGIN();
    for (auto fileID: filesID)
    {
      RemoveFile(fileID);
    }
    WRITE_END();
    return true;
  }

  bool DBManager::RemoveTags(const std::vector<FileID>& filesID, const Tags& tags)
  {
    WRITE_BEGIN();
    auto mWordsIndex = GetWordsIndex(tags);
    std::vector<WordIndex> vTags;
    std::for_each(mWordsIndex.begin(), mWordsIndex.end(), [&vTags](const std::pair<std::string, WordIndex>& item) {
      vTags.emplace_back(item.second);
    });
    void* pData = nullptr;
    uint32_t len = 0;
    for (auto fileID : filesID)
    {
      m_pDatabase->Get(m_mDBs[TABLE_FILE2TAG], fileID, pData, len);
      if (len) {
        std::vector<WordIndex> vTagIdx((WordIndex*)pData, (WordIndex*)pData + len / sizeof(WordIndex));
        eraseData(vTagIdx, vTags);
        m_pDatabase->Put(m_mDBs[TABLE_FILE2TAG], fileID, vTagIdx.data(), vTagIdx.size() * sizeof(WordIndex));
        if (vTagIdx.size() == 0) {
          SetSnapStep(fileID, BIT_TAG_OFFSET, false);
        }
      }
    }
    for (auto tagID : vTags) {
      m_pDatabase->Get(m_mDBs[TABLE_TAG2FILE], tagID, pData, len);
      if (len) {
        std::vector<FileID> vFils((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
        eraseData(vFils, filesID);
        m_pDatabase->Put(m_mDBs[TABLE_TAG2FILE], tagID, vFils.data(), vFils.size() * sizeof(FileID));
      }
    }
    RemoveKeywords(filesID, tags);
    WRITE_END();
    return true;
  }

  bool DBManager::RemoveClasses(const std::vector<std::string>& classes)
  {
    WRITE_BEGIN();
    auto mIndexes = GetWordsIndex(classes);
    std::vector<WordIndex> vWordsIndx;
    std::for_each(mIndexes.begin(), mIndexes.end(), [&vWordsIndx](auto& item) {
      vWordsIndx.emplace_back(item.second);
    });

    nlohmann::json test;
    this->GetClasses("/", test);
    T_LOG("class", "debug: %s", test.dump().c_str());

    std::deque<ClassID> vAllClasses;
    std::map<ClassID, std::vector<FileID>> mFilesID;
    for (auto& classPath : classes) {
      // get children of class
      ClassID clsID;
      std::string clsKey;
      std::tie(clsID, clsKey) = EncodePath2Hash(classPath);
      vAllClasses.emplace_back(clsID);
      //auto children = GetClassChildren(clsKey);
      //vAllClasses.insert(vAllClasses.end(), children.begin(), children.end());
      // remove from parent class
      ClassID parentID = GetClassParent(clsKey);
      std::string parentPath = GetClassByHash(parentID);
      std::tie(parentID, clsKey) = EncodePath2Hash(parentPath);
      void* pData = nullptr;
      uint32_t len = 0;
      m_pDatabase->Get(m_mDBs[TABLE_CLASS2HASH], clsKey, pData, len);
      std::vector<ClassID> parentChildren((ClassID*)pData, (ClassID*)pData + len/sizeof(ClassID));
      eraseData(parentChildren, clsID);
      T_LOG("class", "remove children from parent(%u) %s: %s[%u] from [%llu]%s",
        parentID, clsKey.c_str(), classPath.c_str(), clsID, parentChildren.size(), format_vector(parentChildren).c_str());
      m_pDatabase->Put(m_mDBs[TABLE_CLASS2HASH], parentID, parentChildren.data(), parentChildren.size() * sizeof(ClassID));
    }

    while(vAllClasses.size() > 0)
    {
      auto cid = vAllClasses.front();
      T_LOG("class", " 1 class queue: %llu, %s", vAllClasses.size(), format_vector(vAllClasses).c_str());
      vAllClasses.pop_front();
      T_LOG("class", " 2 class queue: %llu", vAllClasses.size());
      std::string cname = GetClassByHash(cid);
      ClassID clsID;
      std::string clsKey;
      std::tie(clsID, clsKey) = EncodePath2Hash(cname);
      auto children = GetClassChildren(clsKey);
      vAllClasses.insert(vAllClasses.end(), children.begin(), children.end());
      T_LOG("class", " 3 class queue: %llu, %s", vAllClasses.size(), format_vector(vAllClasses).c_str());
      // remove keywords
      // prepare to remove children of files
      void* pData = nullptr;
      uint32_t len = 0;
      m_pDatabase->Get(m_mDBs[TABLE_CLASS2FILE], clsID, pData, len);
      if (len) {
        std::vector<FileID> vFilesID((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
        // remove file to class
        for (FileID fid : vFilesID) {
          m_pDatabase->Get(m_mDBs[TABLE_FILE2CLASS], fid, pData, len);
          if (len) {
            std::vector<ClassID> vSrcID((ClassID*)pData, (ClassID*)pData + len / sizeof(ClassID));
            eraseData(vSrcID, clsID);
            m_pDatabase->Put(m_mDBs[TABLE_FILE2CLASS], fid, vSrcID.data(), vSrcID.size() * sizeof(ClassID));
          }
        }
      }
      // remove current class
      m_pDatabase->Del(m_mDBs[TABLE_CLASS2FILE], clsID);
      m_pDatabase->Del(m_mDBs[TABLE_HASH2CLASS], clsID);
      m_pDatabase->Del(m_mDBs[TABLE_CLASS2HASH], clsKey);
      T_LOG("class", "remove class, class(id:%u, hash: %s) %s, children: %s, current class: %llu",
        clsID, clsKey.c_str(), cname.c_str(), format_vector(children).c_str(), vAllClasses.size());
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
      m_pDatabase->Get(m_mDBs[TABLE_FILE2CLASS], fid, pData, len);
      if (len) {
        std::vector<ClassID> vSrcID((ClassID*)pData, (ClassID*)pData + len / sizeof(ClassID));
        eraseData(vSrcID, vClassID);
        m_pDatabase->Put(m_mDBs[TABLE_FILE2CLASS], fid, vSrcID.data(), vSrcID.size() * sizeof(ClassID));
      }
    }
    // remove classes 2 file
    for (ClassID cid : vClassID) {
      m_pDatabase->Get(m_mDBs[TABLE_CLASS2FILE], cid, pData, len);
      if (len) {
        std::vector<FileID> vSrcID((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
        eraseData(vSrcID, filesID);
        m_pDatabase->Put(m_mDBs[TABLE_CLASS2FILE], cid, vSrcID.data(), vSrcID.size() * sizeof(FileID));
      }
    }
    return true;
  }

  bool DBManager::SetTags(const std::vector<FileID>& filesID, const std::vector<std::string>& tags)
  {
    if (_flag == ReadOnly) return false;
    WRITE_BEGIN();
    std::vector<FileID> existID = mapExistFiles(filesID);
    auto mIndexes = GetWordsIndex(tags);
    std::for_each(mIndexes.begin(), mIndexes.end(), [this, &existID](std::pair<std::string, WordIndex> item) {
      AddTagPY(item.first, item.second);
      AddFileID2Tag(existID, item.second);
      T_LOG("tag", "exist ID: %s", format_vector(existID).c_str());
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
      m_pDatabase->Put(m_mDBs[TABLE_FILE2TAG], fileID, vTags.data(), tags.size() * sizeof(WordIndex));
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
      if (!m_pDatabase->Get(m_mDBs[TABLE_FILE_META], fileID, pData, len)) {
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
        }
        items.emplace_back(item);
      }
      // tag
      Tags tags;
      if (m_pDatabase->Get(m_mDBs[TABLE_FILE2TAG], fileID, pData, len)) {
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
      if (m_pDatabase->Get(m_mDBs[TABLE_FILE2CLASS], fileID, pData, len)) {
        uint32_t* pClassID = (uint32_t*)pData;
        for (size_t idx = 0; idx < len / sizeof(uint32_t); ++idx) {
          std::string clsName = GetClassByHash(*(pClassID + idx));
          classes.push_back(clsName);
          T_LOG("files", "class id: %d, name: %s", *(pClassID + idx), clsName.c_str());
        }
      }
      // keyword
      Keywords keywords;
      if (m_pDatabase->Get(m_mDBs[TABLE_FILE2KEYWORD], fileID, pData, len)) {
        WordIndex* pWordIndex = (WordIndex*)pData;
        keywords = GetWordByIndex(pWordIndex, len / sizeof(WordIndex));
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
    m_pDatabase->Filter(m_mDBs[TABLE_FILESNAP], [&snaps](uint32_t k, void* pData, uint32_t len) -> bool {
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
    std::set<WordIndex> sIndexes;
    std::map<uint32_t, std::vector<FileID>> vFiles;
    uint32_t parentID = 0;
    std::string parentKey(ROOT_CLASS_PATH);
    if (parent != ROOT_CLASS_PATH) {
      std::tie(parentID, parentKey) = EncodePath2Hash(parent);
    }
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[TABLE_CLASS2HASH], parentKey, pData, len);
    size_t cnt = len / sizeof(WordIndex);
    if (len) {
      std::string sParent = (parent == ROOT_CLASS_PATH ? "" : parent + ROOT_CLASS_PATH);
      for (size_t idx = 0; idx < cnt; ++idx) {
        nlohmann::json jCls;
        uint32_t clsID = *((uint32_t*)pData + idx);
        std::string name = GetClassByHash(clsID);
        jCls["name"] = name;
        uint32_t childID;
        std::string sChild;
        std::tie(childID, sChild) = EncodePath2Hash(sParent + name);
        if (childID == parentID) continue;
        auto clzChildren = GetClassChildren(sChild);
        auto files = GetFilesOfClass(childID);
        T_LOG("class", "clsID:%lld, parentID: %lld,  %d children %s", clsID, parentID, childID, format_vector(clzChildren).c_str());
        if (clzChildren.size()|| files.size()) {
          nlohmann::json children;
          for (auto& clzID : clzChildren) {
            nlohmann::json clz;
            clz["id"] = clzID;
            clz["type"] = "clz";
            children.push_back(clz);
          }
          for (auto& fileID : files) {
            children.push_back(fileID);
          }
          jCls["children"] = children;
        }
        jCls["type"] = "clz";
        classes.push_back(jCls);
      }
    }
    m_pDatabase->Get(m_mDBs[TABLE_CLASS2FILE], parentID, pData, len);
    for (size_t idx = 0; idx < len / sizeof(FileID); ++idx) {
      FileID fid = *((FileID*)pData + idx);
      nlohmann::json jFile;
      jFile["id"] = fid;
      Snap snap = GetFileSnap(fid);
      jFile["name"] = std::get<1>(snap);
      classes.push_back(jFile);
    }
    T_LOG("class", "parent: %s(%s), get class: %s", parent.c_str(), parentKey.c_str(), classes.dump().c_str());
    return true;
  }

  bool DBManager::GetAllTags(TagTable& tags)
  {
    READ_BEGIN(TABLE_TAG_INDX);
    READ_BEGIN(TABLE_TAG2FILE);

    m_pDatabase->Filter(m_mDBs[TABLE_TAG_INDX], [this, &tags](const std::string& alphabet, void* pData, uint32_t len)->bool {
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
    WRITE_BEGIN();
    std::vector<std::string> names({ oldName, newName });
    auto mIndexes = GetWordsIndex(names);
    auto oldPath = EncodePath2Hash(oldName);
    auto newPath = EncodePath2Hash(newName);
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[TABLE_CLASS2HASH], oldPath.second, pData, len);
    if (len) {
      std::vector<uint32_t> vHash((uint32_t*)pData, (uint32_t*)pData + len / sizeof(uint32_t*));
      m_pDatabase->Put(m_mDBs[TABLE_CLASS2HASH], newPath.second, vHash.data(), vHash.size() * sizeof(uint32_t));
      m_pDatabase->Del(m_mDBs[TABLE_CLASS2HASH], oldPath.second);
    }
    m_pDatabase->Get(m_mDBs[TABLE_HASH2CLASS], oldPath.first, pData, len);
    if (len) {
      m_pDatabase->Put(m_mDBs[TABLE_HASH2CLASS], oldPath.first, (void*)newName.data(), newName.size());
    }
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
          m_pDatabase->Get(m_mDBs[TABLE_FILESNAP], fileID, pData, len);
          std::string s((char*)pData, len);
          T_LOG("file", "mutation snap: %s", s.c_str());
          json jsn = json::parse(s);
          jsn["name"] = itr.value().dump();
          s = to_string(jsn);
          m_pDatabase->Put(m_mDBs[TABLE_FILESNAP], fileID, s.data(), s.size());
          // TODO: how to update keyword
        }
        m_pDatabase->Get(m_mDBs[TABLE_FILE_META], fileID, pData, len);
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
        m_pDatabase->Put(m_mDBs[TABLE_FILE_META], fileID, sMeta.data(), sMeta.size());
      }
    }
    WRITE_END();
    return true;
  }

  bool DBManager::Query(const std::string& query, std::vector<FileInfo>& filesInfo)
  {
    namespace pegtl = TAO_PEGTL_NAMESPACE;
    QueryActions actions(this);
    pegtl::memory_input input(query, "");
    T_LOG("query", "sql: %s", query.c_str());
    if (pegtl::parse<caxios::QueryGrammar, caxios::action>(input, actions)) {
      std::vector<FileID> vFilesID = actions.invoke();
      T_LOG("query", "result files: %s", format_vector(vFilesID).c_str());
      return GetFilesInfo(vFilesID, filesInfo);
    }
    T_LOG("query", "fail sql: %s", query.c_str());
    return false;
  }

  std::vector<caxios::FileID> DBManager::Query(const std::string& tableName, const std::vector<time_t>& values)
  {
    std::vector<FileID> outFilesID;
    return outFilesID;
  }

  std::vector<FileID> DBManager::Query(const std::string& tableName, const std::vector<std::string>& values)
  {
    std::vector<FileID> outFilesID;
    std::vector<std::string> vKeywords;
    for (auto& cond: values)
    {
      vKeywords.emplace_back(cond);
    }
    T_LOG("query", "table: %s, DBI: %d, keyword: %s", tableName.c_str(), m_mDBs[tableName], format_vector(vKeywords).c_str());
    auto indexes = GetWordsIndex(vKeywords);
    if (indexes.size() == 0) return outFilesID;
    std::set<FileID> sFilesID;
    for (auto item: indexes)
    {
      void* pData = nullptr;
      uint32_t len = 0;
      if (!m_pDatabase->Get(m_mDBs[tableName], item.second, pData, len)) return outFilesID;
      if (len) {
        sFilesID.insert((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
      }
    }
    outFilesID.assign(sFilesID.begin(), sFilesID.end());
    return std::move(outFilesID);
  }

  void DBManager::ValidVersion()
  {
    void* pData = nullptr;
    uint32_t len = 0;
    if (m_pDatabase->Get(m_mDBs[TABLE_SCHEMA], SCHEMA_VERSION, pData, len)) {
    }
  }

  void DBManager::InitMap()
  {
    m_mKeywordMap[TB_Keyword] = TABLE_KEYWORD2FILE;
    m_mKeywordMap[TB_Tag] = TABLE_TAG2FILE;
    m_mKeywordMap[TB_Class] = TABLE_CLASS2FILE;
    //m_mKeywordMap[TB_Annotation] = TABLE_KEYWORD2FILE;
    m_mKeywordMap[TB_FileID] = TABLE_FILE_META;
  }

  bool DBManager::AddFile(FileID fileid, const MetaItems& meta, const Keywords& keywords)
  {
    using namespace nlohmann;
    json dbMeta;
    dbMeta = meta;
    std::string value = to_string(dbMeta);
    T_LOG("file", "Write ID: %d, Meta Info: %s", fileid, value.c_str());
    auto vData = json::to_cbor(dbMeta);
    if (!m_pDatabase->Put(m_mDBs[TABLE_FILE_META], fileid, (void*)(&vData[0]), vData.size())) {
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
    if (!m_pDatabase->Put(m_mDBs[TABLE_FILESNAP], fileid, (void*)(sSnaps.data()), sSnaps.size())) {
      T_LOG("file", "Put TABLE_FILESNAP Fail %s", sSnaps.c_str());
      return false;
    }
    T_LOG("file", "Write Snap: %s", sSnaps.c_str());
    // meta
    for (MetaItem m : meta) {
      std::string& name = m["name"];
      if (m_mTables.find(name) == m_mTables.end()) continue;
      std::vector<FileID> vID;
      vID.emplace_back(fileid);
      T_LOG("file", "add meta(%s): %s, %d", name.c_str(), m["value"].c_str(), fileid);
      m_mTables[name]->Add(m["value"], vID);
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
    m_pDatabase->Get(m_mDBs[TABLE_TAG2FILE], index, pData, len);
    if (len) {
      std::vector<FileID> vTemp((FileID*)pData, (FileID*)pData + len/sizeof(FileID));
      addUniqueDataAndSort(vID, vTemp);
    }
    addUniqueDataAndSort(vID, vFilesID);
    m_pDatabase->Put(m_mDBs[TABLE_TAG2FILE], index, (void*)vID.data(), vID.size() * sizeof(FileID));
    return true;
  }

  bool DBManager::AddFileID2Keyword(FileID fileID, WordIndex keyword)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[TABLE_KEYWORD2FILE], keyword, pData, len);
    if (len > 0) {
      FileID* pIDs = (FileID*)pData;
      size_t cnt = len / sizeof(FileID);
      std::vector<FileID> vFilesID(pIDs, pIDs + cnt);
      if (addUniqueDataAndSort(vFilesID, fileID)) return true;
      T_LOG("keyword", "add fileID: %d", fileID);
      if (!m_pDatabase->Put(m_mDBs[TABLE_KEYWORD2FILE], keyword, &(vFilesID[0]), sizeof(FileID) * vFilesID.size())) return false;
    }
    else {
      if (!m_pDatabase->Put(m_mDBs[TABLE_KEYWORD2FILE], keyword, &fileID, sizeof(FileID))) return false;
    }
    return true;
  }

  bool DBManager::AddKeyword2File(WordIndex keyword, FileID fileID)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[TABLE_FILE2KEYWORD], fileID, pData, len);
    T_LOG("keyword", "add keyword Index: %d, len: %d", keyword, len);
    if (len > 0) {
      WordIndex* pWords = (WordIndex*)pData;
      size_t cnt = len / sizeof(WordIndex);
      std::vector<WordIndex> vWordIndx(pWords, pWords + cnt);
      if (addUniqueDataAndSort(vWordIndx, keyword)) return true;
      T_LOG("keyword", "add keywords: %d, fileID: %d", keyword, fileID);
      if (!m_pDatabase->Put(m_mDBs[TABLE_FILE2KEYWORD], fileID, &(vWordIndx[0]), sizeof(WordIndex) * vWordIndx.size())) return false;
    }
    else {
      if (!m_pDatabase->Put(m_mDBs[TABLE_FILE2KEYWORD], fileID, &keyword, sizeof(WordIndex))) return false;
      T_LOG("keyword", "add new keywords: %d, fileID: %d", keyword, fileID);
    }
    return true;
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
    if (m_pDatabase->Get(m_mDBs[TABLE_TAG_INDX], py[0], pData, len)) {
      WordIndex* pWords = (WordIndex*)pData;
      size_t cnt = len / sizeof(WordIndex);
      sIndx = std::set<WordIndex>(pWords, pWords + cnt);
    }
    sIndx.insert(indx);
    std::vector< WordIndex> vIndx(sIndx.begin(), sIndx.end());
    m_pDatabase->Put(m_mDBs[TABLE_TAG_INDX], py[0], vIndx.data(), vIndx.size() * sizeof(WordIndex));
    WRITE_END();
    return true;
  }

  bool DBManager::AddClass2FileID(uint32_t key, const std::vector<FileID>& vFilesID)
  {
    std::vector<FileID> vFiles(vFilesID);
    //std::sort(vFiles.begin(), vFiles.end());
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[TABLE_CLASS2FILE], key, pData, len);
    std::vector<FileID> vID;
    if (len) {
      vID.assign((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
    }
    addUniqueDataAndSort(vID, vFilesID);
    T_LOG("class", "add files to class %d: %s", key, format_vector(vID).c_str());
    m_pDatabase->Put(m_mDBs[TABLE_CLASS2FILE], key, (void*)vID.data(), vID.size() * sizeof(FileID));
    return true;
  }

  bool DBManager::AddFileID2Class(const std::vector<FileID>& filesID, uint32_t clsID)
  {
    for (auto fileID : filesID) {
      void* pData = nullptr;
      uint32_t len = 0;
      m_pDatabase->Get(m_mDBs[TABLE_FILE2CLASS], fileID, pData, len);
      std::vector<uint32_t> vClasses;
      if (len) {
        vClasses.assign((uint32_t*)pData, (uint32_t*)pData + len / sizeof(uint32_t));
      }
      addUniqueDataAndSort(vClasses, clsID);
      T_LOG(TABLE_FILE2CLASS, "add class to file, fileID: %u, class: %s, new class: %u", fileID, format_vector(vClasses).c_str(), clsID);
      m_pDatabase->Put(m_mDBs[TABLE_FILE2CLASS], fileID, vClasses.data(), vClasses.size()*sizeof(uint32_t));
    }
    return true;
  }

  void DBManager::MapHash2Class(uint32_t clsID, const std::string& name)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[TABLE_HASH2CLASS], clsID, pData, len);
    if (len == 0) {
      m_pDatabase->Put(m_mDBs[TABLE_HASH2CLASS], clsID, (void*)name.data(), name.size());
    }
  }

  std::vector<uint32_t> DBManager::AddClassImpl(const std::vector<std::string>& classes)
  {
    std::vector<uint32_t> vClasses;
    auto mIndexes = GetWordsIndex(classes);
    for (auto& clazz : classes) {
      std::vector<std::string> vTokens = split(clazz, '/');
      std::vector<WordIndex> vClassPath;
      std::for_each(vTokens.begin(), vTokens.end(), [&mIndexes, &vClassPath](const std::string& token) {
        T_LOG("class", "class token: %s, %d", token.c_str(), mIndexes[token]);
        vClassPath.emplace_back(mIndexes[token]);
      });
      std::string sChild = serialize(vClassPath);
      T_LOG("class", "serialize result: %s", format_x16(sChild).c_str());
      uint32_t child = GenerateClassHash(sChild);
      vClasses.emplace_back(child);
      MapHash2Class(child, clazz);
      uint32_t parent = ROOT_CLASS_ID;
      std::string sParent(ROOT_CLASS_PATH);
      if (vClassPath.size() > 0) {
        vClassPath.pop_back();
        if (vClassPath.size() != 0) {
          sParent = serialize(vClassPath);
          parent = GenerateClassHash(sParent);
        }
        T_LOG("class", "parent(%llu): %s, %u", vClassPath.size(),(sParent).c_str(), parent);
        if (parent == 0) {
          //MapHash2Class(parent, "/");
        }
      }
      T_LOG("class", "add class to class, parent: %d, current: %d, name: %s", parent, child, clazz.c_str());
      // update parent 
      void* pData = nullptr;
      uint32_t len = 0;
      m_pDatabase->Get(m_mDBs[TABLE_CLASS2HASH], sChild, pData, len);
      if (len == 0) {
        // add . and ..
        std::vector<uint32_t> vCurrent({ child , parent });
        m_pDatabase->Put(m_mDBs[TABLE_CLASS2HASH], sChild, vCurrent.data(), vCurrent.size() * sizeof(uint32_t));
        T_LOG("class", "add class [%s] to hash [%u(%s), %u]", format_x16(sChild).c_str(), child, clazz.c_str(), parent);
      }
      m_pDatabase->Get(m_mDBs[TABLE_CLASS2HASH], sParent, pData, len);
      std::vector<uint32_t> children;
      if (len) {
        children.assign((uint32_t*)pData, (uint32_t*)pData + len / sizeof(uint32_t));
      }
      addUniqueDataAndSort(children, child);
      m_pDatabase->Put(m_mDBs[TABLE_CLASS2HASH], sParent, children.data(), children.size() * sizeof(uint32_t));
    }
    return std::move(vClasses);
  }

  bool DBManager::RemoveFile(FileID fileID)
  {
    using namespace nlohmann;
    //
    void* pData = nullptr;
    uint32_t len = 0;
    if (!m_pDatabase->Get(m_mDBs[TABLE_FILE_META], fileID, pData, len)) {
      T_LOG("file", "GET TABLE_FILE_META Fail %d", fileID);
      return false;
    }
    T_LOG("file", "meta len: %d", len);
    std::vector<uint8_t> info((uint8_t*)pData, (uint8_t*)pData + len);
    json meta = json::from_cbor(info);
    // meta
    for (MetaItem m : meta) {
      std::string& name = m["name"];
      if (m_mTables.find(name) == m_mTables.end()) continue;
      m_mTables[name]->Delete(m["value"], fileID);
    }
    // tag
    RemoveFile(fileID, TABLE_FILE2TAG, TABLE_TAG2FILE);
    // class
    RemoveFile(fileID, TABLE_FILE2CLASS, TABLE_CLASS2FILE);
    // snap
    m_pDatabase->Del(m_mDBs[TABLE_FILESNAP], fileID);
    m_pDatabase->Del(m_mDBs[TABLE_FILE_META], fileID);
    // TODO: keyword match files
    RemoveFileIDFromKeyword(fileID);
    // TODO: 回收键值
    return true;
  }

  void DBManager::RemoveFile(FileID fileID, const std::string& file2type, const std::string& type2file)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[file2type], fileID, pData, len);
    std::vector<WordIndex> vTypesID((WordIndex*)pData, (WordIndex*)pData + len / sizeof(WordIndex));
    for (auto typeID : vTypesID)
    {
      m_pDatabase->Get(m_mDBs[type2file], typeID, pData, len);
      std::vector<FileID> vFiles((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
      eraseData(vFiles, fileID);
      m_pDatabase->Put(m_mDBs[type2file], typeID, vFiles.data(), vFiles.size() * sizeof(FileID));
    }
    m_pDatabase->Del(m_mDBs[file2type], fileID);
  }

  bool DBManager::RemoveTag(FileID fileID, const Tags& tags)
  {
    READ_BEGIN(TABLE_FILE2TAG);
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[TABLE_FILE2TAG], fileID, pData, len);
    if (len == 0) return true;
    auto indexes = GetWordsIndex(tags);
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
    m_pDatabase->Put(m_mDBs[TABLE_FILE2TAG], fileID, pData, len);
    return true;
  }

  bool DBManager::RemoveClassImpl(const std::string& classPath)
  {
    ClassID clsID;
    std::string clsKey;
    std::tie(clsID, clsKey) = EncodePath2Hash(classPath);
    auto children = GetClassChildren(clsKey);
    for (auto cID: children)
    {
    }
    return true;
  }

  bool DBManager::RemoveKeywords(const std::vector<FileID>& filesID, const std::vector<std::string>& keyword)
  {
    auto mIndexes = GetWordsIndex(keyword);
    std::vector<WordIndex> vWordsIndx;
    std::for_each(mIndexes.begin(), mIndexes.end(), [&vWordsIndx](auto& item) {
      vWordsIndx.emplace_back(item.second);
    });
    void* pData = nullptr;
    uint32_t len = 0;
    for (FileID fileID : filesID) {
      m_pDatabase->Get(m_mDBs[TABLE_FILE2KEYWORD], fileID, pData, len);
      if (len) {
        std::vector<WordIndex> vWords((WordIndex*)pData, (WordIndex*)pData + len / sizeof(WordIndex));
        eraseData(vWords, vWordsIndx);
        m_pDatabase->Put(m_mDBs[TABLE_FILE2KEYWORD], fileID, vWords.data(), vWords.size() * sizeof(WordIndex));
      }
    }
    for (auto& item : mIndexes)
    {
      m_pDatabase->Get(m_mDBs[TABLE_KEYWORD2FILE], item.second, pData, len);
      if (len) {
        std::vector<FileID> vFsID((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
        eraseData(vFsID, filesID);
        m_pDatabase->Put(m_mDBs[TABLE_KEYWORD2FILE], item.second, vFsID.data(), vFsID.size() * sizeof(FileID));
      }
    }
    return true;
  }

  bool DBManager::RemoveFileIDFromKeyword(FileID fileID)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[TABLE_FILE2KEYWORD], fileID, pData, len);
    if (len) {
      std::vector<WordIndex> vIndexes((WordIndex*)pData, (WordIndex*)pData + len/sizeof(WordIndex));
      for (auto indx: vIndexes)
      {
        m_pDatabase->Get(m_mDBs[TABLE_KEYWORD2FILE], indx, pData, len);
        if (len) {
          std::vector<FileID> vFilesID((FileID*)pData, (FileID*)pData + len / sizeof(FileID));
          eraseData(vFilesID, fileID);
          T_LOG("file", "remove %d result: %s", fileID, format_vector(vFilesID).c_str());
          m_pDatabase->Put(m_mDBs[TABLE_KEYWORD2FILE], indx, vFilesID.data(), vFilesID.size() * sizeof(FileID));
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
    if (!m_pDatabase->Get(m_mDBs[TABLE_FILE2TAG], fileID, pData, len)) return true;
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
    m_pDatabase->Get(m_mDBs[TABLE_CLASS2FILE], sPath, pData, len);
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
    m_pDatabase->Get(m_mDBs[TABLE_FILESNAP], fileID, pData, len);
    if (len > 0) return true;
    return false;
  }

  bool DBManager::IsClassExist(const std::string& clazz)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[TABLE_CLASS2HASH], clazz, pData, len);
    if (len == 0) return false;
    return true;
  }

  uint32_t DBManager::GenerateClassHash(const std::string& clazz)
  {
    if (IsClassExist(clazz)) return GetClassHash(clazz);
    auto e = encode(clazz);
    T_LOG("class", "hash: %u", e);
    return e;
  }

  uint32_t DBManager::GetClassHash(const std::string& clazz)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    if (!m_pDatabase->Get(m_mDBs[TABLE_CLASS2HASH], clazz, pData, len)) return 0;
    return *(uint32_t*)pData;
  }

  uint32_t DBManager::GetClassParent(const std::string& clazz)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    if (!m_pDatabase->Get(m_mDBs[TABLE_CLASS2HASH], clazz, pData, len)) return 0;
    return *((uint32_t*)pData+1);
  }

  std::pair<uint32_t, std::string> DBManager::EncodePath2Hash(const std::string& classPath)
  {
    if (classPath == "/") return std::pair<uint32_t, std::string>({ ROOT_CLASS_ID, ROOT_CLASS_PATH });
    std::vector<std::string> vWords = split(classPath, '/');
    auto mIndexes = GetWordsIndex(vWords);
    std::vector<WordIndex> vIndexes;
    vIndexes.resize(vWords.size());
    std::transform(vWords.begin(), vWords.end(), vIndexes.begin(), [&mIndexes](const std::string& word)->WordIndex {
      return mIndexes[word];
      });
    std::string sKey = serialize(vIndexes);
    uint32_t hash = GetClassHash(sKey);
    T_LOG("class", "encode path: %s to (%u, %s)", classPath.c_str(), hash, format_x16(sKey).c_str());
    return std::make_pair(hash, sKey);
  }

  std::vector<ClassID> DBManager::GetClassChildren(const std::string& clazz)
  {
    std::vector<ClassID> vChildren;
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[TABLE_CLASS2HASH], clazz, pData, len);
    size_t cnt = len / sizeof(uint32_t);
    if (cnt > 2) {
      vChildren.assign((uint32_t*)pData + 2, (uint32_t*)pData + cnt);
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
      m_pDatabase->Get(m_mDBs[TABLE_HASH2CLASS], hs, pData, len);
      if (len) {
        cls.assign((char*)pData, (char*)pData + len);
      }
    }
    return std::move(cls);
  }

  std::vector<caxios::FileID> DBManager::GetFilesOfClass(uint32_t clsID)
  {
    std::vector<caxios::FileID> vFilesID;
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[TABLE_CLASS2FILE], clsID, pData, len);
    for (size_t idx = 0; idx < len / sizeof(FileID); ++idx) {
      FileID fid = *((FileID*)pData + idx);
      vFilesID.push_back(fid);
    }
    m_pDatabase->Filter(m_mDBs[TABLE_CLASS2FILE], [](uint32_t k, void* pData, uint32_t len)->bool {
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
      m_pDatabase->Get(m_mDBs[TABLE_FILE_META], fileID, pData, len);
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
      if (item["db"] == true) {
        std::string name = trunc(item["name"].dump());
        m_mTables[name] = new TableMeta(m_pDatabase, name, trunc(item["type"].dump()));
        T_LOG("query", "schema: %s", item["name"].dump().c_str());
      }
    }
    T_LOG("construct", "schema: %s", meta.c_str());
  }

  void DBManager::UpdateCount1(CountType ct, int value)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    uint32_t cnt = 0;
    m_pDatabase->Get(m_mDBs[TABLE_COUNT], CT_UNCALSSIFY, pData, len);
    if (pData) cnt = *(uint32_t*)pData;
    cnt += value;
    m_pDatabase->Put(m_mDBs[TABLE_COUNT], CT_UNCALSSIFY, (void*)&cnt, sizeof(uint32_t));
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
    m_pDatabase->Put(m_mDBs[TABLE_FILESNAP], fileID, (void*)snap.data(), snap.size());
  }

  char DBManager::GetSnapStep(FileID fileID, nlohmann::json& jSnap)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    m_pDatabase->Get(m_mDBs[TABLE_FILESNAP], fileID, pData, len);
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
    m_pDatabase->Get(m_mDBs[TABLE_FILESNAP], fileID, pData, len);
    if (len) {
      snap = *(Snap*)pData;
    }
    return std::move(snap);
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
      std::vector<std::string> vTokens = split(word, '/');
      for (auto& token: vTokens)
      {
        // 取字索引
        if (!m_pDatabase->Get(m_mDBs[TABLE_KEYWORD_INDX], token, pData, len)) {
          // 如果tag字符串不存在，添加
          T_LOG("dict", "Add new word: %s", token.c_str());
          m_pDatabase->Put(m_mDBs[TABLE_KEYWORD_INDX], token, &lastIndx, sizeof(WordIndex));
          m_pDatabase->Put(m_mDBs[TABLE_INDX_KEYWORD], lastIndx, (void*)token.data(), token.size());
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
      m_pDatabase->Put(m_mDBs[TABLE_KEYWORD_INDX], 0, &lastIndx, sizeof(WordIndex));
    }
    //m_pDatabase->Filter(m_mDBs[TABLE_KEYWORD_INDX], [](const std::string& k, void* pData, uint32_t len)->bool {
    //  T_LOG("keyword indx: %s", k.c_str());
    //  return false;
    //});
    return std::move(mIndexes);
  }

  WordIndex DBManager::GetWordIndex(const std::string& word)
  {
    void* pData = nullptr;
    uint32_t len = 0;
    if (!m_pDatabase->Get(m_mDBs[TABLE_KEYWORD_INDX], word, pData, len)) return 0;
    return *(WordIndex*)pData;
  }

  std::vector<std::string> DBManager::GetWordByIndex(const WordIndex* const wordsIndx, size_t cnt)
  {
    std::vector<std::string> vWords(cnt);
    for (size_t idx = 0; idx< cnt;++idx)
    {
      WordIndex index = wordsIndx[idx];
      if (index == 0) {
        T_LOG("dict", "word index: 0");
        continue;
      }
      void* pData = nullptr;
      uint32_t len = 0;
      if(!m_pDatabase->Get(m_mDBs[TABLE_INDX_KEYWORD], index, pData, len)) continue;
      std::string word((char*)pData, len);
      vWords[idx] = word;
    }
    return std::move(vWords);
  }

  std::vector<std::vector<FileID>> DBManager::GetFilesIDByTagIndex(const WordIndex* const wordsIndx, size_t cnt)
  {
    std::vector<std::vector<FileID>> vFilesID;
    for (size_t idx = 0; idx < cnt; ++idx) {
      WordIndex wordIdx = wordsIndx[idx];
      void* pData = nullptr;
      uint32_t len = 0;
      if(!m_pDatabase->Get(m_mDBs[TABLE_TAG2FILE], wordIdx, pData, len)) continue;
      FileID* pFileID = (FileID*)pData;
      std::vector<FileID> filesID(pFileID, pFileID + len / sizeof(FileID));
      vFilesID.emplace_back(filesID);
    }
    return std::move(vFilesID);
  }

}