#include "QueryRule.h"

namespace caxios {
  class QueryAction {
  public:
  };

  template< typename Rule > struct action {};
  template<> struct action< literal_key > {
    template< typename ActionInput >
    static void apply(const ActionInput& in, QueryAction& action) {
      if (!in.empty()) {
      }
    }
  };
  template<> struct action< literal_string_value > {
    template< typename ActionInput >
    static void apply(const ActionInput& in, QueryAction& action) {
      if (!in.empty()) {
      }
    }
  };
}