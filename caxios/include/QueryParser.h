/************************************************************************/
/* 查询语法解析器
 * 解析json，生成一棵语法树
 * 语法树的每个节点是一个规则的实例
 * 遍历语法树，执行每个规则，得到查询结果
/************************************************************************/
#pragma once
#include "json.hpp"
#include <memory>
#include <map>

namespace caxios {
  enum EOperator {
    Equal = 0,
    GreaterThan = 1,
    Greater,
    Less,
    LessThan,
    In,
    NotIn,
    And,
    Terminate,
  };

  class IStatement {
  public:
    virtual ~IStatement() {}

  protected:
    IStatement(const std::string& k)
      :_identity(k)
    {}
  
  protected:
    std::string _identity;
  };

  class IExpression {
  public:
    static std::shared_ptr<IExpression> Build(const std::string& s, const nlohmann::json& v);
    IExpression(const std::string& k) {}

    virtual ~IExpression() {}

    void setKey(std::shared_ptr<IStatement> k){_key = k;}
    void setValue(std::shared_ptr<IStatement> v){_value = v;}
    void setSymbol(std::shared_ptr<IStatement> s){_symbol = s;}
    std::string GetKey() { return _key->_identity;}

  private:
    static std::map < std::string, std::function< std::shared_ptr<caxios::IExpression>(const nlohmann::json& v)> > m_Creator;

  protected:
    std::shared_ptr<IStatement> _key;
    std::shared_ptr<IStatement> _value;
    std::shared_ptr<IStatement> _symbol;
    std::vector<std::shared_ptr<IExpression> > _expressions;
  };

  class AST{
  public:
    virtual ~AST();
    virtual void travel(std::function<void(IExpression* pExpression)> visitor);

  public:
    void Parse(const nlohmann::json& query);

  protected:
    std::shared_ptr<IExpression> _pRoot;
  };

  class JsonKey : public IStatement {
  public:
    JsonKey(const std::string& k);

  };
  class JsonOperator: public IExpression {
  public:
    JsonOperator(const std::string& k, const nlohmann::json& v, EOperator op);

  private:
    EOperator _op;
  };
  class JsonTerminate : public IExpression {
  public:
    JsonTerminate() :IExpression("T") {}
  };

  class JsonAnd : public IExpression {
  public:
    JsonAnd(const std::string& k, const nlohmann::json& v, EOperator op);
  };

  class Return : public IExpression {};
  class Unkwon: public IExpression{};

  class QueryParser {
  public:
    QueryParser();
    ~QueryParser();

    bool Parse(const nlohmann::json& query);
    void Travel(std::function<void(IExpression* pExpression)> visitor);

  private:
    AST* _ast = nullptr;
  };
}