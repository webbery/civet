#include "QueryParser.h"
#include "log.h"

namespace caxios {

  std::map < std::string, std::function < std::shared_ptr<caxios::IExpression>(const nlohmann::json&) > > IExpression::m_Creator;
  std::shared_ptr<caxios::IExpression> IExpression::Build(const std::string& s, const nlohmann::json& v)
  {
    if (m_Creator.size() == 0) {
      m_Creator["$lt"] = [](const nlohmann::json& v) ->std::shared_ptr<caxios::IExpression> {
        std::shared_ptr<caxios::IExpression> ptr(new caxios::JsonOperator("$lt", v, LessThan));
        return ptr;
      };
      m_Creator["and"] = [](const nlohmann::json& v) ->std::shared_ptr<caxios::IExpression> {
        std::shared_ptr<caxios::IExpression> ptr(new caxios::JsonOperator("and", v, And));
        return ptr;
      };
      m_Creator["$eq"] = [](const nlohmann::json& v) ->std::shared_ptr<caxios::IExpression> {
        std::shared_ptr<caxios::IExpression> ptr(new caxios::JsonOperator("$eq", v, Equal));
        return ptr;
      };
    }
    if (s.empty()) {
      return std::shared_ptr<caxios::IExpression>(new caxios::JsonTerminate());
    }
    auto itr = m_Creator.find(s);
    if (itr == m_Creator.end()) {
      if (v.is_array()) {

      }
      else if (v.is_object()) {

      }
      else {
        return std::shared_ptr<caxios::IExpression>(new caxios::JsonOperator(s, v, Equal));
      }
    }
    return m_Creator[s](v);
  }


  QueryParser::QueryParser()
  {
  }

  QueryParser::~QueryParser()
  {
    if (_ast) {
      delete _ast;
      _ast = nullptr;
    }
  }

  bool QueryParser::Parse(const nlohmann::json& query)
  {
    if (_ast) {
      delete _ast;
    }
    _ast = new AST();
    _ast->Parse(query);
    return true;
  }

  void QueryParser::Travel(std::function<void(IExpression* pExpression)> visitor)
  {
    _ast->travel(visitor);
  }

  AST::~AST()
  {
  }

  void AST::travel(std::function<void(IExpression* pExpression)> visitor)
  {
    // 深度遍历表所有的达式. TODO: 可以采用拓扑排序，提高执行器并发度
    if (nullptr != _pRoot) {
      T_LOG("Travel: %s", _pRoot->GetKey().c_str());
      for (auto child : _pRoot->children()) {
        T_LOG("Child: %s", child->GetKey().c_str());
        visitor(child.get());
      }
      visitor(_pRoot.get());
    }
  }

  void AST::Parse(const nlohmann::json& query)
  {
    T_LOG("Parse: %s", query.dump().c_str());
    if (query.size() > 1) { // and 语义
      _pRoot = IExpression::Build("and", query);
      return;
    }
    for (auto itr = query.begin(); itr != query.end(); ++itr) {
      std::string k = itr.key();
      nlohmann::json v = itr.value();
      _pRoot = IExpression::Build(k, v);
    }
  }

  JsonKey::JsonKey(const std::string& k)
    :IStatement(k)
  {

  }

  JsonOperator::JsonOperator(const std::string& key, const nlohmann::json& v, EOperator op)
    :IExpression(key), _op(op)
  {
    if (v.is_object()) {
      for (auto itr = v.begin(); itr != v.end(); ++itr) {
        std::string k = itr.key();
        std::string val = itr.value();
        _expressions.emplace_back(Build(k, val));
      }
    }
    else {
      if(v.is_string()) {}
    }
  }

}