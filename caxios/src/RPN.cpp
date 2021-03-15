#include "RPN.h"
#include "Keyword.h"
#include "Condition.h"
#include "Expression.h"
#include "log.h"
#include "util/util.h"

namespace caxios {
  DataType getType(const std::string_view& value)
  {
    std::string input(value.substr(strlen(VALUE_PREFIX)));
    if (isDate(input)) {
      return QT_DateTime;
    }
    else if (isColor(input)) {
      return QT_Color;
    }
    return QT_String;
  }

  RPN::RPN(std::unique_ptr< tpp::node > root)
  {
    this->recusive(std::move(root));
  }

  RPN::~RPN()
  {

  }

  void RPN::debug()
  {
    std::string output;
    while (!_sSymbols.empty()) {
      std::unique_ptr<ISymbol> pSym = std::move(_sSymbols.front());
      output += pSym->Value() + ", ";
      _sSymbols.erase(_sSymbols.begin());
    }
    T_LOG("rpn", "%s", output.c_str());
  }

  void RPN::recusive(std::unique_ptr< tpp::node >&& root)
  {
    if (root->children.size()) {
      for (auto& itr = root->children.rbegin(); itr != root->children.rend(); ++itr) {
        recusive(std::move(*itr));
      }
    }
    while (true) {
      const std::string_view view = root->source;
      if (!view.empty()) {
        std::unique_ptr<ISymbol> pSym = nullptr;
        if (is_table(view)) {
          T_LOG("rpn", "table: %s", root->source.c_str());
          pSym = std::unique_ptr< ISymbol>(new ITableProxy(root->source.substr(strlen(TABLE_PREFIX)).c_str()));
        }
        else if (is_operator(view)) {
          pSym = IExpression::Create(root->string().c_str(), _curType);
        }
        else if(is_value(view)){
          T_LOG("rpn", "value: %s", root->source.c_str());
          _curType = getType(view);
          pSym = std::unique_ptr< ISymbol>(new ValueInstance(root->source.substr(strlen(VALUE_PREFIX)), QT_Origin));
        }
        else {
          break;
        }
        _sSymbols.emplace_back(std::move(pSym));
      }
      else {
        std::unique_ptr<ISymbol> pSym = nullptr;
        if (is_and(root->type)) {
          pSym = IExpression::Create(OP_And, _curType);
        }
        else if (root->type.find("literal_eq") != std::string::npos) {
          pSym = IExpression::Create(OP_Equal, _curType);
        }
        else if (is_in(root->type)) {
          pSym = IExpression::Create(OP_In, _curType);
        }
        else {
          break;
        }
        _sSymbols.emplace_back(std::move(pSym));
      }
      break;
    }
  }

}
