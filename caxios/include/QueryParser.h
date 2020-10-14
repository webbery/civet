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
  class IToken {
  public:
    explicit IToken(const std::string& k) :_identity(k) {}
    virtual ~IToken() {}
  protected:
    std::string _identity;
  };

  class ISymbol: public IToken {};
  class IStatement : public IToken {
  public:
    virtual ~IStatement() {}

  protected:
    IStatement(const std::string& k)
      :IToken(k)
    {}
  
  protected:
  };

  class IExpression : public IToken {
  public:
    static std::shared_ptr<IExpression> Build(const std::string& s, const nlohmann::json& v);
    IExpression(const std::string& k) :IToken(k) {}

    virtual ~IExpression() {}

  private:
    static std::map < std::string, std::function< std::shared_ptr<caxios::IExpression>(const nlohmann::json& v)> > m_Creator;
    std::shared_ptr<IToken> _key;
    std::shared_ptr<IToken> _value;
    std::shared_ptr<ISymbol> _symbol;
  };

  class AST{
  public:
    virtual ~AST();
    virtual void travel(std::function<void(IExpression* pExpression)> visitor);

  public:
    void Parse(const nlohmann::json& query);

  protected:
    std::shared_ptr<IExpression> _pExpression;
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
    std::vector<std::shared_ptr<IExpression>> _children;
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