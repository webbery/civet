#include "util.h"

namespace caxios {
  
  std::string ConvertToString(const v8::Local<v8::String>& value)
  {
    v8::Isolate* isolate = v8::Isolate::GetCurrent();
    const int length = value->Utf8Length(isolate)+1;
    char* charFileName = new char[length];
    memset(charFileName, length, 0x00);
    (*value)->WriteUtf8(isolate, charFileName);
    std::string str;
    str.assign(charFileName);
    return std::move(str);
  }

  int32_t ConvertToInt32(const v8::Local<v8::Value>& value)
  {
    int32_t cnt = 0;
    if (value->IsInt32()) {
#if V8_MAJOR_VERSION == 7
      cnt = value->ToInt32(v8::Isolate::GetCurrent())->Value();
#elif V8_MAJOR_VERSION == 8
      value->Int32Value(Nan::GetCurrentContext()).To(&cnt);
#endif
    }
    return cnt;
  }

  v8::Local<v8::String> StringToValue(const std::string& str)
  {
    v8::Isolate* isolate = v8::Isolate::GetCurrent();
    return v8::String::NewFromUtf8(isolate, str.c_str(), v8::String::kNormalString);
  }

}