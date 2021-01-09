#ifndef _QUERY_ACTION_H_
#define _QUERY_ACTION_H_
#include "QueryRule.h"
#include <map>
#include "datum_type.h"
#include <functional>
#include <variant>
#include "lmdb/lmdb.h"
#include "util/util.h"
#include <vector>
//#include "db_manager.h"
#include <iostream>

namespace caxios {
  class DBManager;

  enum CompareType {
    CT_EQUAL = 0,
    CT_IN,
    CT_GREAT_EQUAL,
    CT_GREAT_THAN,
    CT_LESS_THAN
  };

  enum QueryType {
    QT_String,
    QT_DateTime,
  };

  using system_time = std::chrono::system_clock;
  class QueryCondition {
  public:
    QueryCondition();
    QueryCondition(const std::string& s);
    QueryCondition(time_t s);

    template <typename T>
    T As() const {
      return std::get<T>(m_sCondition);
    }

    QueryType type() const {return m_qType;}
  private:
    QueryType m_qType;
    std::variant< std::string, time_t, double> m_sCondition;
  };

  template<typename Ret>
  std::vector<Ret> Cast(const std::vector<QueryCondition>& conds) {
    std::vector<Ret> vRet;
    for (const QueryCondition& cond : conds) {
      vRet.emplace_back(cond.As<Ret>());
    }
    return std::move(vRet);
  }

  class GreaterThan {
  public:
    GreaterThan(time_t point):_point(point)
    {
      //T_LOG("query", "GreaterThan condition: %lld", _point);
    }
    bool operator()(time_t val) const {
      //auto pt = std::chrono::system_clock::from_time_t(val);
      //auto sec = std::chrono::duration_cast<std::chrono::duration<int>>(pt - _point).count();
      T_LOG("query", "input %lld - point: %lld is %d", val, _point, val > _point);
      return val > _point;
    }
    std::vector<time_t> condition() {
      std::vector<time_t> vt;
      vt.emplace_back(_point);
      return vt;
    }

  private:
    time_t _point;
  };

  class GreaterEqual {
  public:
    GreaterEqual(time_t point)
    {
      _range.emplace_back(point);
    }
    bool operator()(time_t val) const {
      return true;
    }
    //std::vector<time_t> condition() { return _range; }

  private:
    std::vector<time_t> _range;
  };

  class In {
  public:
    In(const std::vector<std::string>& strs)
    :_strs(strs){}

    bool operator()(const std::string& val) const {
      return true;
    }

    std::vector<std::string> condition() { return _strs; }
    std::vector<std::string> condition() const { return _strs; }
  private:
    std::vector<std::string> _strs;
  };

  class Equal {
  public:
    Equal(const std::string& str)
    :_str(str){}

    bool operator()(const std::string& val) const {
      return val == _str;
    }

    //std::vector<std::string> condition() { return _str; }
  private:
    std::string _str;
  };

  enum class Priority : int {};
  template<QueryType QT, CompareType CT> struct CQuery;
  template<> struct CQuery<QT_String, CT_IN> : public In {
    typedef std::string type;
    CQuery(const std::vector<QueryCondition>& conditions)
    :In(Cast<std::string>(conditions)){}
  private:
    Priority _p;
  };

  template<> struct CQuery<QT_DateTime, CT_GREAT_THAN> : public GreaterThan {
    typedef time_t type;
    CQuery(const std::vector<QueryCondition>& conditions)
      :GreaterThan(conditions[0].As<time_t>())
    {
    }
  private:
    Priority _p;
  };

  template<> struct CQuery<QT_DateTime, CT_GREAT_EQUAL> : public GreaterEqual {
    typedef time_t type;
    CQuery(const std::vector<QueryCondition>& conditions)
      :GreaterEqual(conditions[0].As<time_t>())
    {
    }
  private:
    Priority _p;
  };

  template<> struct CQuery<QT_String, CT_EQUAL> : public Equal {
    typedef std::string type;
    CQuery(const std::vector<QueryCondition>& conditions)
      :Equal(conditions[0].As<std::string>()) {}
  };

  template<typename Q> struct CQueryType {
    static Q policy(MDB_val& val) {
      return *(Q*)val.mv_data;
    }
  };
  template<> struct CQueryType<std::string> {
    static std::string policy(MDB_val& val) {
      return std::string((char*)val.mv_data, val.mv_size);
    }
  };

  class IAction {
  public:
    virtual ~IAction() {}
    //virtual void push(const std::string& kw) = 0;
    //virtual void push(const QueryCondition& cond) = 0;
    virtual std::vector<FileID> query(DBManager*) = 0;
  };

  template<QueryType QT, CompareType CT>
  class QueryAction : public IAction {
  public:
    QueryAction(const std::string& k, const std::vector<QueryCondition>& vCond)
    :m_sKeyword(k)
    , m_query(vCond)
    { }

    std::vector<FileID> query(DBManager* pDB) {
      return pDB->QueryImpl(m_sKeyword, m_query/*, m_vQuerySet*/);
    }

    void constraint(const std::vector<FileID>&);

  private:
    std::string m_sKeyword;
    CQuery< QT, CT > m_query;
    std::vector<FileID> m_vQuerySet;
  };

  template<typename T> struct ActionTraits;
  template<> struct ActionTraits<std::string> {
    enum {Kind = QT_String};
  };

  class Factory {
  public:
    static IAction* create(const std::string& k, const std::vector<QueryCondition>, CompareType);
  };
  
  class QueryActions {
  public:
    QueryActions(caxios::DBManager* pDB);
    ~QueryActions();
    // start a query
    void open();
    // close a query
    void close();

    void push(const std::string& key);
    void push(const QueryCondition& cond);
    void push(const CompareType ct);
    std::vector<FileID> invoke();
  private:
    std::string m_sKey;
    std::vector<QueryCondition> m_vCond;
    CompareType m_ctype = CT_EQUAL;

    DBManager* m_pDBManager;
    bool m_bClose = true;
    std::vector< IAction* > m_vActions;
  };

  template< typename Rule > struct action {};
  template<> struct action< literal_string_key > {
    template< typename ActionInput >
    static void apply(const ActionInput& in, QueryActions& actions) {
      if (!in.empty()) {
        actions.open();
        actions.push(in.string());
      }
    }
  };
  template<> struct action< literal_string > {
    template< typename ActionInput >
    static void apply(const ActionInput& in, QueryActions& actions) {
      if (!in.empty()) {
        QueryCondition cond(in.string());
        actions.push(cond);
      }
    }
  };
  template<> struct action< literal_datetime_string> {
    template<typename ActionInput>
    static void apply(const ActionInput& in, QueryActions& actions) {
      if (!in.empty()) {
        time_t ct = str2time(in.string());
        QueryCondition cond(ct);
        actions.push(cond);
      }
    }
  };

  template<> struct action< literal_color> {
    template<typename ActionInput>
    static void apply(const ActionInput& in, QueryActions& val) {
      //val += in.string();
    }
  };
  template<> struct action< literal_op > {
    template< typename ActionInput >
    static void apply(const ActionInput& in, QueryActions& actions) {
      if (!in.empty()) {
      }
    }
  };
  template<> struct action< literal_gt > {
    template< typename ActionInput >
    static void apply(const ActionInput& in, QueryActions& actions) {
      if (!in.empty()) {
        actions.push(CT_GREAT_THAN);
      }
    }
  };
  template<> struct action< literal_array> {
    template< typename ActionInput >
    static void apply(const ActionInput& in, QueryActions& actions) {
      if (!in.empty()) {
        actions.push(CT_IN);
      }
    }
  };
  template<> struct action< literal_close> {
    template<typename ActionInput>
    static void apply(const ActionInput& in, QueryActions& actions) {
      //val += in.string();
      actions.close();
    }
  };
}

#endif
