#include "QueryAction.h"
#include "Table.h"
#include "db_manager.h"
#include "util/util.h"
#include "log.h"

namespace caxios {
  namespace {
    typedef std::vector<FileID> QueryFunc(DBManager* pDB, const std::vector<QueryCondition>& conditions, const std::vector<FileID>&);

    std::vector<FileID> queryKeywords(DBManager* pDB, const std::vector<QueryCondition>& conditions, const std::vector<FileID>&) {
      std::vector<FileID> vf = pDB->QueryImpl(TABLE_KEYWORD2FILE, conditions);
      return std::move(vf);
    }

    bool compare(const system_time::time_point& pt, const system_time::time_point& start, const system_time::time_point& end) {
      return true;
    }

    void init_map(std::map<std::string, std::function<QueryFunc>>& m) {
      if (m.size() != 0) return;
      m[TB_Keyword] = queryKeywords;
      //m[TB_Tag] = TABLE_TAG2FILE;
      //m[TB_Class] = TABLE_CLASS2FILE;
      //m[TB_Annotation] = TABLE_KEYWORD2FILE;
      //m[TB_FileID] = TABLE_FILESNAP;
    }
    std::map<std::string, std::function<QueryFunc>> g_mFuncations;
  }

  QueryCondition::QueryCondition()
  {
  }

  QueryCondition::QueryCondition(const std::string& s)
  {
    m_sCondition = s;
  }

  QueryCondition::QueryCondition(const system_time::time_point& s)
  {
    m_sCondition = s;
  }

  //std::vector<caxios::FileID> QueryAction::query(DBManager* pDB)
  //{
  //  std::vector<caxios::FileID> q;
  //  if (m_query._f != nullptr) {
  //    q = m_query._f(pDB, m_sConditions, m_vQuerySet);
  //  }
  //  return std::move(q);
  //}

  //void QueryAction::constraint(const std::vector<FileID>& subset)
  //{
  //  m_vQuerySet = subset;
  //}

  //void QueryAction::AddCondition(const std::string& cond)
  //{
  //  T_LOG("query", "condition: %s", cond.c_str());
  //  m_sConditions.emplace_back(cond);
  //}

  QueryActions::QueryActions(DBManager* pDB)
    :m_pDBManager(pDB)
  {
    init_map(g_mFuncations);
  }

  QueryActions::~QueryActions()
  {
    for (auto ptr : m_vActions) {
      delete ptr;
    }
  }

  void QueryActions::open()
  {
    if (m_bClose == true) {
      m_bClose = false;
    }
  }

  void QueryActions::close()
  {
    if (m_bClose == true) return;
    m_bClose = false;
  }

  std::vector<caxios::FileID> QueryActions::invoke()
  {
    std::vector<caxios::FileID> result;
    size_t idx = m_vActions.size() - 1;
    while (idx>=0)
    {
      auto back = m_vActions[idx];
      m_vActions.pop_back();
      idx -= 1;
      result = back->query(m_pDBManager);
      if(m_vActions.size() == 0) break;
      //m_vActions.back().constraint(result);
    }
    return std::move(result);
  }

  }