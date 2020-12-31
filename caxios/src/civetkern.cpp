#include "civetkern.h"
#include <iostream>
#include "util/util.h"
#include "log.h"
#define JS_CLASS_NAME  "Caxios"

using namespace v8;

namespace caxios {

	CAxios::CAxios(const std::string& str, int flag, const std::string& meta) {
    T_LOG("CAxios", "new CAxios(%s)", str.c_str());
    if (m_pDBManager == nullptr) {
      m_pDBManager = new DBManager(str, flag, meta);
    }
  }

  std::vector<FileID> CAxios::GenNextFilesID(int cnt)
  {
    return m_pDBManager->GenerateNextFilesID(cnt);
  }

  bool CAxios::AddFiles(const std::vector <std::tuple< FileID, MetaItems, Keywords >>& files)
  {
    return m_pDBManager->AddFiles(files);
  }

  bool CAxios::AddClasses(const std::vector<std::string>& classes, const std::vector<FileID>& filesID)
  {
    return m_pDBManager->AddClasses(classes, filesID);
  }

  bool CAxios::AddClasses(const std::vector<std::string>& classes)
  {
    return m_pDBManager->AddClasses(classes);
  }

  bool CAxios::SetTags(const std::vector<FileID>& filesID, const std::vector<std::string>& tags)
  {
    return m_pDBManager->SetTags(filesID, tags);
  }

  bool CAxios::GetFilesSnap(std::vector<Snap>& snaps)
  {
    return m_pDBManager->GetFilesSnap(snaps);
  }

  bool CAxios::GetFilesInfo(const std::vector<FileID>& filesID, std::vector< FileInfo>& filesInfo)
  {
    return m_pDBManager->GetFilesInfo(filesID, filesInfo);
  }

  bool CAxios::GetUntagFiles(std::vector<FileID>& filesID)
  {
    return m_pDBManager->GetUntagFiles(filesID);
  }

  bool CAxios::GetUnclassifyFiles(std::vector<FileID>& filesID)
  {
    return m_pDBManager->GetUnClassifyFiles(filesID);
  }

  bool CAxios::GetTagsOfFiles(const std::vector<FileID>& filesID, std::vector<Tags>& tags)
  {
    return m_pDBManager->GetTagsOfFiles(filesID, tags);
  }

  bool CAxios::GetClasses(const std::string& parent, nlohmann::json& classes)
  {
    return m_pDBManager->GetClasses(parent, classes);
  }

  bool CAxios::GetAllTags(TagTable& tags)
  {
    return m_pDBManager->GetAllTags(tags);
  }

  bool CAxios::UpdateFileMeta(const std::vector<FileID>& filesID, const nlohmann::json& mutation)
  {
    return m_pDBManager->UpdateFileMeta(filesID, mutation);
  }

  bool CAxios::UpdateFilesClasses(const std::vector<FileID>& filesID, const std::vector<std::string>& classes)
  {
    return m_pDBManager->UpdateFilesClasses(filesID, classes);
  }

  bool CAxios::UpdateClassName(const std::string& oldName, const std::string& newName)
  {
    return m_pDBManager->UpdateClassName(oldName, newName);
  }

  bool CAxios::RemoveFiles(const std::vector<FileID>& files)
  {
    return m_pDBManager->RemoveFiles(files);
  }

  bool CAxios::RemoveTags(const std::vector<FileID>& files, const Tags& tags)
  {
    return m_pDBManager->RemoveTags(files, tags);
  }

  bool CAxios::RemoveClasses(const std::vector<std::string>& classes)
  {
    return m_pDBManager->RemoveClasses(classes);
  }

  bool CAxios::RemoveClasses(const std::vector<std::string>& classes, const std::vector<FileID>& filesID)
  {
    return m_pDBManager->RemoveClasses(classes, filesID);
  }

  bool CAxios::Query(const std::string& query, std::vector< FileInfo>& filesInfo)
  {
    return m_pDBManager->Query(query, filesInfo);
  }

  CAxios::~CAxios() {
    T_LOG("CAxios", "Begin ~CAxios()");
    if (m_pDBManager) {
      delete m_pDBManager;
      m_pDBManager = nullptr;
    }
    T_LOG("CAxios", "Finish ~CAxios()");
  }

  void CAxios::Release(void* data) {
    T_LOG("CAxios", "CAxios::Release()");
    // delete static_cast<CAxios*>(data);
  }

}