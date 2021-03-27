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

}