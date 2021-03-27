#pragma once
#include "ISymbol.h"
#include <variant>
#include "util/util.h"
#include <set>

using namespace caxios;
namespace caxios {

  class ValueInstance : public IStatement {
  public:
    friend bool operator < (const ValueInstance& left, const ValueInstance& right);
    friend bool operator != (const ValueInstance& left, const ValueInstance& right);
    friend bool operator==(const ValueInstance& left, const ValueInstance& right);
    ValueInstance(const char* value, DataType dt) {
      _type = Condition;
    }

    ValueInstance(const std::string& s, DataType dt);
    ValueInstance(time_t s, DataType dt);
    ValueInstance(uint32_t s, DataType dt);

    ValueInstance(ValueInstance&& v);
    ValueInstance& operator = (ValueInstance&& v);
    void* operator& () { return &_sCondition; }

    template <typename T>
    T As() const {
      return std::get<T>(_sCondition);
    }

    DataType dataType() const { return _dType; }
    virtual std::string Value();
    virtual bool isArray() { return false; }
  private:
    DataType _dType;
    std::variant< std::string, time_t, double, uint32_t> _sCondition;
  };

  bool operator < (const ValueInstance& left, const ValueInstance& right);
  bool operator != (const ValueInstance& left, const ValueInstance& right);
  bool operator==(const ValueInstance& left, const ValueInstance& right);

  class ValueArray : public ValueInstance {
  public:
    typedef std::vector< std::unique_ptr<ValueInstance> >::iterator iterator;
    typedef std::vector< std::unique_ptr<ValueInstance> >::const_iterator const_iterator;
    ValueArray(): ValueInstance(nullptr, QT_Array) {
    }
    template<typename T>
    ValueArray(std::vector<T>& v) : ValueInstance(nullptr, QT_Array) {
      for (auto& val: v)
      {
        std::unique_ptr<ValueInstance> p(new ValueInstance(val, QT_Origin));
        _sArray.emplace_back(std::move(p));
      }
    }

    virtual std::string Value() { return "array"; }
    virtual bool isArray() { return true; }

    void push(std::unique_ptr<ValueInstance>& value) {
      _sArray.push_back(std::move(value));
    }

    void push(FileID* pStart, size_t cnt = 1) {
      for (size_t idx = 0; idx<cnt;++idx)
      {
        auto ptr = std::lower_bound(_sArray.begin(), _sArray.end(), pStart[idx],
          [](const std::unique_ptr<ValueInstance>& left, const FileID& right) ->bool {
            return left->As<FileID>() < right;
          });
        if (ptr == _sArray.end() || (*ptr)->As<FileID>() != pStart[idx]) {
          _sArray.insert(ptr, std::move(std::unique_ptr<ValueInstance>(new ValueInstance(pStart[idx], QT_Origin))));
        }
      }
    }

    template<typename T>
    std::vector<T> GetArray() {
      std::vector<T> vArr;
      for (const_iterator itr = _sArray.begin(); itr != _sArray.end(); ++itr) {
        vArr.emplace_back((*itr)->As<T>());
      }
      return std::move(vArr);
    }

    iterator begin() { return _sArray.begin(); }
    iterator end() { return _sArray.end(); }
  private:
    std::vector< std::unique_ptr<ValueInstance> > _sArray;
  };
}