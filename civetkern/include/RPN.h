#pragma once
/************************************************************************/
/* Reverse Polish Notation
/************************************************************************/\
#include <deque>
#include <pegtl/contrib/parse_tree.hpp>
#include "CompareType.h"
#include "ISymbol.h"
#include "database.h"

namespace caxios {
  namespace tpp = tao::pegtl::parse_tree;

  template<const char* op> struct type_traits{
    typedef std::string type;
  };

  DataType getType(const std::string_view& value);

  class RPN {
  public:
    typedef std::deque<std::unique_ptr<ISymbol>>::iterator iterator;
  public:
    RPN(std::unique_ptr< tpp::node > root);
    ~RPN();

    void debug();

    iterator begin() { return _sSymbols.begin(); }
    iterator end() { return _sSymbols.end(); }

  private:
    void recusive(std::unique_ptr< tpp::node >&& root);
    //void addSymbol()
  private:
    DataType _curType = QT_String;
    int _statements = 0;
    std::deque<std::unique_ptr<ISymbol>> _sSymbols;
  };
}