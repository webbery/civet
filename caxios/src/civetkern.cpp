#include "civetkern.h"
#include <iostream>
#include "util/util.h"
#include "log.h"
#define JS_CLASS_NAME  "Caxios"

using namespace v8;

namespace caxios {

	CAxios::CAxios(const std::string& str, int flag, const std::string& meta) {
    T_LOG("new CAxios(%s)", str.c_str());
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

  bool CAxios::RemoveFiles(const std::vector<FileID>& files)
  {
    return true;
  }

  bool CAxios::FindFiles(const nlohmann::json& query, std::vector< FileInfo>& filesInfo)
  {
    m_qParser.Parse(query);
    m_qParser.Travel([](IExpression* pExpression) {

      });
    return true;
  }

  CAxios::~CAxios() {
    T_LOG("Begin ~CAxios()");
    if (m_pDBManager) {
      delete m_pDBManager;
      m_pDBManager = nullptr;
    }
    T_LOG("Finish ~CAxios()");
  }

  void CAxios::Release(void* data) {
    T_LOG("CAxios::Release()");
    // delete static_cast<CAxios*>(data);
  }

}