#include "QueryAction.h"
#include "Table.h"
#include "db_manager.h"

namespace caxios {
  std::map<std::string, std::string> QueryAction::m_mKeywords;

  bool QueryAction::Init()
  {
    if (m_mKeywords.size() == 0) {
      m_mKeywords[TB_Keyword] = TABLE_KEYWORD2FILE;
      m_mKeywords[TB_Tag] = TABLE_TAG2FILE;
      m_mKeywords[TB_Class] = TABLE_CLASS2FILE;
      //m_mKeywords[TB_Annotation] = TABLE_KEYWORD2FILE;
      m_mKeywords[TB_FileID] = TABLE_FILESNAP;
    }
  }

  QueryAction::QueryAction(DBManager* pDB)
    :m_pDBManager(pDB)
  {

  }

  void QueryAction::AddKeyword(const std::string& kw)
  {
    m_sKeyword = kw;
  }

  void QueryAction::AddCondition(QueryType qt)
  {
  }

  void QueryAction::AddCondition(const std::string& cond)
  {
    T_LOG("query", "condition: %s", cond.c_str());
    m_pDBManager->QueryKeyword(m_mKeywords[m_sKeyword], cond, m_vFilesID);
  }

  std::vector<caxios::FileID> QueryAction::GetResult()
  {
    return std::move(m_vFilesID);
  }

}