#include "QueryAction.h"
#include "Table.h"
#include "db_manager.h"
#include "util/util.h"
#include "log.h"
#include <algorithm>

namespace caxios {
  namespace {
    typedef std::vector<FileID> QueryFunc(DBManager* pDB, const std::vector<QueryCondition>& conditions, const std::vector<FileID>&);

    //std::vector<FileID> queryKeywords(DBManager* pDB, const std::vector<QueryCondition>& conditions, const std::vector<FileID>&) {
    //  std::vector<FileID> vf = pDB->QueryImpl(TABLE_KEYWORD2FILE, conditions);
    //  return std::move(vf);
    //}

    void init_map(std::map<std::string, std::function<QueryFunc>>& m) {
      if (m.size() != 0) return;
      //m[TB_Keyword] = queryKeywords;
      //m[TB_Tag] = TABLE_TAG2FILE;
      //m[TB_Class] = TABLE_CLASS2FILE;
      //m[TB_Annotation] = TABLE_KEYWORD2FILE;
      //m[TB_FileID] = TABLE_FILESNAP;
    }
    std::map<std::string, std::function<QueryFunc>> g_mFuncations;

    //struct creator {
    //  creator(){}
    //  IAction* operator()(const std::string& key, const std::vector<QueryCondition>& conds) {

    //  }
    //private:

    //};
    //std::map<QueryType, std::map<CompareType, creator>> g_mActionFactory;
  }

  QueryCondition::QueryCondition()
  {
  }

  QueryCondition::QueryCondition(const std::string& s)
  {
    if (isColor(s)) {
      m_qType = QT_Color;
    }
    else {
      m_qType = QT_String;
    }
    m_sCondition = s;
  }

  QueryCondition::QueryCondition(time_t s)
  {
    m_qType = QT_DateTime;
    m_sCondition = s;
  }

  IAction* Factory::create(const std::string& k, const std::vector<QueryCondition> conds, CompareType ct)
  {
    if (conds.size() == 0) return nullptr;
    auto type = conds[0].type();
    if (type == QT_DateTime && ct == CT_GREAT_THAN) {
      return new QueryAction<QT_DateTime, CT_GREAT_THAN>(k, conds);
    }
    else if (type == QT_String && ct == CT_IN) {
      return new QueryAction<QT_String, CT_IN>(k, conds);
    }
    else if (type == QT_String && ct == CT_EQUAL) {
      return new QueryAction<QT_String, CT_EQUAL>(k, conds);
    }
    else if (type == QT_Color && ct == CT_EQUAL) {
      return new QueryAction<QT_Color, CT_EQUAL>(k, conds);
    }
    T_LOG("query", "create action fail, type: %d, compare: %d", type, ct);
    //g_mActionFactory[QT_DateTime][CT_GREAT_THAN](k, conds);
    return nullptr;
  }

  QueryActions::QueryActions(DBManager* pDB)
    :m_pDBManager(pDB)
  {
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
    // create action now
    IAction* pAction = Factory::create(m_sKey, m_vCond, m_ctype);
    if (pAction) m_vActions.emplace_back(pAction);
    m_vCond.clear();
  }

  void QueryActions::push(const std::string& key)
  {
    m_sKey = trunc(key);
  }
  void QueryActions::push(const QueryCondition& cond)
  {
    m_vCond.emplace_back(cond);
  }
  void QueryActions::push(const CompareType qt)
  {
    m_ctype = qt;
  }

  std::vector<caxios::FileID> QueryActions::invoke()
  {
    std::vector<caxios::FileID> temp, result;
    int idx = m_vActions.size() - 1;
    // currently use 'and' in multiple query conditions.
    // TODO: construct an executable queue from parser tree 
    while (idx>=0)
    {
      auto back = m_vActions[idx];
      m_vActions.pop_back();
      idx -= 1;
      std::vector<caxios::FileID> qr = back->query(m_pDBManager);
      if (temp.size() == 0) temp = qr;
      else {
        std::set_intersection(std::begin(temp), std::end(temp), std::begin(qr), std::end(qr),
          std::inserter(result, std::begin(result)));
      }
      if(m_vActions.size() == 0) break;
      //m_vActions.back().constraint(result);
    }
    if (result.size() == 0 && temp.size() != 0) result = temp;
    return std::move(result);
  }

  }