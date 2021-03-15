#include "Expression.h"

namespace caxios {

  void convert(const std::string& val, uint32_t& ret)
  {
    char* p;
    ret = strtoul(val.substr(1).c_str(), &p, 16);
  }

  void convert(const std::string& val, std::string& ret)
  {
    ret = val;
  }

  void convert(const std::string& val, time_t& ret)
  {

  }

  //class GreaterThan {
  //public:
  //  GreaterThan(time_t point) :_point(point)
  //  {
  //    //T_LOG("query", "GreaterThan condition: %lld", _point);
  //  }
  //  bool operator()(time_t val) const {
  //    //auto pt = std::chrono::system_clock::from_time_t(val);
  //    //auto sec = std::chrono::duration_cast<std::chrono::duration<int>>(pt - _point).count();
  //    T_LOG("query", "input %lld - point: %lld is %d", val, _point, val > _point);
  //    return val > _point;
  //  }
  //  std::vector<time_t> condition() {
  //    std::vector<time_t> vt;
  //    vt.emplace_back(_point);
  //    return vt;
  //  }

  //private:
  //  time_t _point;
  //};

  //class GreaterThanEqual {
  //public:
  //  GreaterThanEqual(time_t point)
  //  {
  //    _range.emplace_back(point);
  //  }
  //  bool operator()(time_t val) const {
  //    return true;
  //  }
  //  //std::vector<time_t> condition() { return _range; }

  //private:
  //  std::vector<time_t> _range;
  //};

  //class In {
  //public:
  //  In(const std::vector<std::string>& strs)
  //    :_strs(strs) {}

  //  bool operator()(const std::string& val) const {
  //    for (const std::string& s : _strs)
  //    {
  //      if (val == s) return true;
  //    }
  //    return false;
  //  }

  //  std::vector<std::string> condition() { return _strs; }
  //  std::vector<std::string> condition() const { return _strs; }
  //private:
  //  std::vector<std::string> _strs;
  //};

  //class Near {
  //public:
  //  Near(const std::string& str, float distance)
  //    :_d(distance) {
  //    _color = color(str);
  //  }

  //  bool operator()(const std::string& val) const {
  //    uint32_t col = color(val);
  //    if (lab_distance(col, _color) < _d) {
  //      return true;
  //    }
  //    return false;
  //  }

  std::unique_ptr< caxios::IExpression> IExpression::Create(const char* name, DataType type)
  {
    switch (type) {
    case QT_Color: return IExpression::Create<data_traits<QT_Color>::type>(name);
    case QT_DateTime:  return IExpression::Create<data_traits<QT_DateTime>::type>(name);
    default:
      break;
    }
    return IExpression::Create< data_traits<QT_String>::type>(name);
  }

  //private:
  //  uint32_t color(const std::string& col)const {
  //    // #FF
  //    char* p;
  //    return strtoul(col.substr(1).c_str(), &p, 16);
  //  }
  //private:
  //  uint32_t _color;
  //  float _d;
  //};

}