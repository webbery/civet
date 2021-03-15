#pragma once
#include "Keyword.h"
#include "ISymbol.h"
#include <memory>
#include <cassert>
#include "intrinsic.h"

namespace caxios {
  void convert(const std::string& val, uint32_t& ret);
  void convert(const std::string& val, std::string& ret);
  void convert(const std::string& val, time_t& ret);

  template<typename T>
  T convert(const std::string& val) {
    T ret;
    convert(val, ret);
    return ret;
  }

  class DescartesDistance{
  public:
    template<typename T>
    static float distance(const T& t1, const T& t2) {
      return 0;
    }
  };
  class LabDistance {
  public:
    template<typename T>
    static float distance(const T& t1, const T& t2) {
      return 0;
    }
    static float distance(const uint32_t& t1, const uint32_t& t2) {
      return lab_distance(t1, t2);
    }
  };

  template<typename T>
  class GreateThan {
  public:
  private:
    T _pt;
  };

  template <typename T>
  class Equal {
  public:
    bool operator()(const T& t1, const T& t2) {
      return t1 == t2;
    }
  };

  template<typename T, typename D = DescartesDistance>
  class Near {
  public:
    Near(float radius) :_radius(radius) {}
    bool operator()(const T& t1, const T& t2) {
      if (D::distance(t1, t2) < _radius) return true;
      return false;
    }
  private:
    float _radius = 0;
  };

  template <typename T>
  class In {
  public:
    bool operator()(const T& t1, const T& t2) {
      return t1 == t2;
    }
  };

  template<typename T>
  class GreatThan {
  public:
    bool operator()(const T& t1, const T& t2) {
      return t1 > t2;
    }
  };

  template<typename T>
  class And {
  public:
    bool operator()(const T& t1, const T& t2) {
      return true;
    }
  };

  class IExpression : public ISymbol {
  public:
    virtual std::string Value() { return _name; }

    static std::unique_ptr< IExpression> Create(const char* name, DataType type);

    template<typename T>
    static std::unique_ptr<IExpression> Create(const char* name)
    {
      if (strcmp(name, OP_Equal) == 0) {
        return std::unique_ptr<ExpressEqual<T>>(new ExpressEqual<T>());
      }
      else if (strcmp(name, OP_In) == 0) {
        return std::unique_ptr<ExpressIn<T>>(new ExpressIn<T>());
      }
      else if (strcmp(name, OP_GreateThan) == 0) {
        return std::unique_ptr<ExpressGreatThan<T>>(new ExpressGreatThan<T>());
      }
      else if (strcmp(name, OP_And) == 0) {
        return std::unique_ptr< ExpressAnd<T> >(new ExpressAnd<T>());
      }
      else if (strcmp(name, OP_Near) == 0) {
        return std::unique_ptr< ExpressNear<T> >(new ExpressNear<T>(40));
      }
      assert(false);
      return nullptr;
    }

    virtual bool compare(const std::string& left, const std::string& right) {
      return false;
    }
    virtual bool compare(const time_t& left, const time_t& right) { 
      return false;
    }
    virtual bool compare(const double& left, const double& right) {
      return false;
    }
    virtual bool compare(const uint32_t& left, const uint32_t& right) {
      return false;
    }

  protected:
    IExpression(const char* name)
      :_name(name), ISymbol(Expression){
    }

  private:
    std::string _name;
  };

  template<typename T>
  class ExpressEqual : public IExpression, public Equal<T> {
  public:
    ExpressEqual() : IExpression(OP_Equal) {}

    virtual bool compare(const T& left, const T& right) {
      //T t = convert<T>(val);
      return this->operator ()(left, right);
    }
  private:
  };

  template<typename T>
  class ExpressIn : public IExpression, public In<T> {
  public:
    ExpressIn() : IExpression(OP_In) {}

    virtual bool compare(const T& left, const T& right) {
      return this->operator ()(left, right);
    }
  private:
  };

  template<typename T>
  class ExpressGreatThan : public IExpression, public GreatThan<T> {
  public:
    ExpressGreatThan() : IExpression(OP_GreateThan) {}

    virtual bool compare(const T& left, const T& right) {
      return this->operator ()(left, right);
    }
  private:
  };

  template<typename T>
  class ExpressAnd : public IExpression, public And<T> {
  public:
    ExpressAnd(): IExpression(OP_And){}

    virtual bool compare(const T& left, const T& right) {
      return this->operator()(left, right);
    }
  };

  template<typename T>
  class ExpressNear : public IExpression, public Near<T, LabDistance> {
  public:
    ExpressNear(float r) : IExpression(OP_Near), Near<T, LabDistance>(r) {}
    virtual bool compare(const T& left, const T& right) {
      return this->operator()(left, right);
    };
  };
}