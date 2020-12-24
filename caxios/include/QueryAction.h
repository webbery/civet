#pragma once
#include "QueryRule.h"
#include <map>
#include "datum_type.h"
#include <functional>
#include <variant>
#include "lmdb/lmdb.h"

namespace caxios {

#define TB_Keyword    "keyword"
#define TB_Tag        "tag"
#define TB_Class      "class"
#define TB_Annotation "annotation"
#define TB_FileID     "fileid"

  class DBManager;
  enum CompareType {
    CT_EQUAL = 0,
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
    QueryCondition(const system_time::time_point& s);

    template <typename T>
    T As() const {
      return std::get<T>(m_sCondition);
    }
  private:
    std::variant< std::string, system_time::time_point, double> m_sCondition;
  };

  //template<enum caxios::QueryType> struct QueryTypeTraits;
  //template<> struct QueryTypeTraits< QT_DateTime> {
  //  typedef system_time::time_point type;
  //};

  //template<QueryType QT, enum caxios::CompareType> struct QueryFuncTraits;
  //template<QueryType QT> struct QueryFuncTraits<QT, CT_GREAT_THAN> {
  //  typedef QueryTypeTraits< enum QueryType >::type type;
  //  typedef bool func(const type& pt, const type& start, const type& end);
  //  static bool impl(const type& pt, const type& start, const type& end) {
  //    return true;
  //  }
  //};

  enum class Priority : int {};
  template<QueryType QT, CompareType CT> struct Query;
  //struct Query {
  //  Priority _p;
  //  std::function<QueryFuncTraits<QT, CT>::func> _f;
  //};

  template<> struct Query<QT_DateTime, CT_GREAT_THAN> {
    Priority _p;
    std::function<bool (const system_time::time_point&, const system_time::time_point& , const system_time::time_point& )> _f;
  };

  class IAction {
  public:
    virtual ~IAction() {}
    virtual void push(const std::string& kw) = 0;
    virtual void push(const QueryCondition& cond) = 0;
    virtual std::vector<FileID> query(DBManager*) = 0;
  };

  template<QueryType QT,CompareType CT>
  class QueryAction : public IAction {
  public:
    void push(const std::string& kw) {
      m_sKeyword = trunc(kw);
    }
    void push(const QueryCondition& cond) {
      m_sConditions.emplace_back(cond);
    }
    std::vector<FileID> query(DBManager* pDB) {
      m_query._f()
    }

    void constraint(const std::vector<FileID>&);

  private:
    std::string m_sKeyword;
    Query< QT, CT > m_query;
    std::vector<QueryCondition> m_sConditions;
    std::vector<FileID> m_vQuerySet;
  };

  template<typename T> struct ActionTraits;
  template<> struct ActionTraits<std::string> {
    enum {Kind = QT_String};
  };
  class QueryActions {
  public:
    QueryActions(DBManager* pDB);
    ~QueryActions();
    // start a query
    void open();
    // close a query
    void close();

    template<typename T>
    void push(const T& t) {
      if (m_cIndx == 0) {
        //m_sKey = t;
        m_cIndx = 1;
      }
      else {
        m_cIndx = 0;
        //new QueryAction<
      }
      m_vActions.back()->push(t);
    }
    std::vector<FileID> invoke();
  private:
    char m_cIndx = 0;
    std::string m_sKey;
    std::variant<std::string, system_time::time_point> m_vCond;

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
        QueryCondition cond(std::chrono::system_clock::from_time_t(ct));
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
  template<> struct action< literal_close> {
    template<typename ActionInput>
    static void apply(const ActionInput& in, QueryActions& actions) {
      //val += in.string();
      actions.close();
    }
  };
}