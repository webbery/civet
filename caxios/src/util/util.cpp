#include "util.h"

namespace caxios {
  
  std::string ConvertToString(v8::Isolate* isolate, const v8::Local<v8::String>& value)
  {
    const int length = value->Utf8Length(isolate)+1;
    char* charFileName = new char[length];
    memset(charFileName, length, 0x00);
    (*value)->WriteUtf8(isolate, charFileName);
    std::string str;
    str.assign(charFileName);
    return std::move(str);
  }

}