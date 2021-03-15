#pragma once
#include <string>
#include <memory>

namespace caxios {

  struct color {
    uint32_t _color;
  };

  template <typename To, typename From>
  std::unique_ptr<To> dynamic_unique_cast(std::unique_ptr<From>&& p) {
    if (To* cast = dynamic_cast<To*>(p.get()))
    {
      std::unique_ptr<To> result(cast/*, std::move(p.get_deleter())*/);
      p.release();
      return result;
    }
    return std::unique_ptr<To>(nullptr); // or throw std::bad_cast() if you prefer
  }

  enum DataType {
    QT_Origin,
    QT_String = 0x1,
    QT_Number = 0x2,
    QT_DateTime = 0x4,
    QT_Color = 0x8,
    QT_Array = 0x100
  };

  template<DataType DT> struct data_traits {
    typedef std::string type;
  };
  template<> struct data_traits<QT_Color> {
    typedef uint32_t type;
  };
  template<> struct data_traits<QT_DateTime> {
    typedef time_t type;
  };

  enum SymbolType {
    Unknown,
    Statement,
    Expression,
    Table,
    Condition
  };
  class ISymbol {
  public:
    ISymbol(SymbolType t): _type(t){}
    ISymbol(const ISymbol&) = delete;
    ISymbol(ISymbol&&) = delete;
    virtual ~ISymbol() {}
    virtual std::string Value() = 0;
    virtual SymbolType symbolType() { return _type; }
  protected:
    SymbolType _type;
  };

  class IStatement : public ISymbol {
  public:
    IStatement(): ISymbol(Statement) {
    }
    

    virtual std::string Value() { return ""; }
  };

  class ITableProxy : public IStatement {
  public:
    ITableProxy(const char* name)
      :_name(name) {
      _type = Table;
    }
    virtual std::string Value() { return _name; }
  private:
    std::string _name;
  };
  
}