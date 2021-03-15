#include "Condition.h"
#include "log.h"
namespace caxios {

  ValueInstance::ValueInstance(const std::string& s, DataType dt)
  {
    if (isColor(s)) {
      _dType = QT_Color;
      uint32_t c = str2color(s);
      _sCondition = c;
    }
    else if (isDate(s)) {
      _dType = QT_DateTime;
      time_t val = str2time(s);
      _sCondition = val;
    }
    else {
      _dType = QT_String;
      _sCondition = s;
    }
    //T_LOG("query", "value %s type: %d",s.c_str(), _dType);
    _type = Condition;
  }

  ValueInstance::ValueInstance(time_t s, DataType dt)
  {
    _type = Condition;
    _dType = QT_DateTime;
    _sCondition = s;
  }

  ValueInstance::ValueInstance(uint32_t s, DataType dt)
  {
    _type = Condition;
    _dType = dt;
    _sCondition = s;
  }

  ValueInstance::ValueInstance(ValueInstance&& v)
  {
    _dType = v._dType;
    _sCondition = v._sCondition;
    _type = v._type;
  }

  ValueInstance& ValueInstance::operator=(ValueInstance&& v)
  {
    if (this == &v) return *this;
    _dType = v._dType;
    _sCondition = v._sCondition;
    _type = v._type;
    return *this;
  }

  std::string ValueInstance::Value()
  {
    std::string val;
    switch (_dType) {
    case QT_DateTime:
      val = std::to_string(As<time_t>());
      T_LOG("query", "datetime value instance: %s", val.c_str());
      return val;
    }
    val = this->As<std::string>();
    T_LOG("query", "string value instance: %s", val.c_str());
    return val;

  }

  bool operator<(const ValueInstance& left, const ValueInstance& right)
  {
    DataType dType = left.dataType();
    switch (dType)
    {
    case caxios::QT_String:
      return left.As<data_traits<QT_String>::type>() < right.As<data_traits<QT_String>::type>();
    //case caxios::QT_Number:
    //  return left.As<data_traits<QT_Number>::type>() < right.As<data_traits<QT_Number>::type>();
    case caxios::QT_DateTime:
      return left.As<data_traits<QT_DateTime>::type>() < right.As<data_traits<QT_DateTime>::type>();
    case caxios::QT_Color:
      return left.As<data_traits<QT_Color>::type>() < right.As<data_traits<QT_Color>::type>();
    default:
      return left.As<uint32_t>() < right.As<uint32_t>();
    }
    return false;
  }

  bool operator!=(const ValueInstance& left, const ValueInstance& right)
  {
    return left._sCondition != right._sCondition;
  }

  bool operator==(const ValueInstance& left, const ValueInstance& right)
  {
    return !operator!=(left, right);
  }
}