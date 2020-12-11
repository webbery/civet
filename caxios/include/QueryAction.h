#include "QueryRule.h"
#include <map>
#include "datum_type.h"

namespace caxios {

#define TB_Keyword    "keyword"
#define TB_Tag        "tag"
#define TB_Class      "class"
#define TB_Annotation "annotation"
#define TB_FileID     "fileid"

  enum struct QueryType {
    QT_EQUAL = 0,
    QT_GREAT_THAN,
    QT_LESS_THAN
  };

  class DBManager;
  class QueryAction {
  public:
    static bool Init();
    QueryAction(DBManager* pDB);
    void AddKeyword(const std::string& kw);
    void AddCondition(QueryType qt);
    void AddCondition(const std::string& cond);
    std::vector<FileID> GetResult();
  private:
    static std::map<std::string, std::string> m_mKeywords;   // map query keyword to table

    std::string m_sKeyword;
    QueryType m_qType = QueryType::QT_EQUAL;
    std::vector<std::string> m_sConditions;
    DBManager* m_pDBManager = nullptr;
    std::vector<FileID> m_vFilesID;
  };

  template< typename Rule > struct action {};
  template<> struct action< literal_key > {
    template< typename ActionInput >
    static void apply(const ActionInput& in, QueryAction& action) {
      if (!in.empty()) {
        action.AddKeyword(in.string());
      }
    }
  };
  template<> struct action< literal_value_impl > {
    template< typename ActionInput >
    static void apply(const ActionInput& in, QueryAction& action) {
      if (!in.empty()) {
        action.AddCondition(in.string());
      }
    }
  };
  template<> struct action< literal_op > {
    template< typename ActionInput >
    static void apply(const ActionInput& in, QueryAction& action) {
      if (!in.empty()) {
      }
    }
  };
}