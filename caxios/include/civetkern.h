#ifndef _CAXIOS_H_
#define _CAXIOS_H_
#include <node.h>
#include <node_object_wrap.h>
#include <nan.h>
#include <string>
// #include <thread>

namespace caxios{
  class CAxios : public Nan::ObjectWrap {
  public:
    static Nan::Persistent<v8::Function> constructor;

  public:
    explicit CAxios(std::string str);
    ~CAxios();
    void Init(v8::Local<v8::Object> exports);

  private:
	//static void New(const Nan::FunctionCallbackInfo<v8::Value>& info);


    static void Release(void* data);

    static bool AddOrUpdateFiles(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static bool AddOrUpdateClass(const Nan::FunctionCallbackInfo<v8::Value>& info);
    bool DeleteClass(const Nan::FunctionCallbackInfo<v8::Value>& info);
    static void GetClass(const Nan::FunctionCallbackInfo<v8::Value>& info);
    void GetNoClassifyFiles(const Nan::FunctionCallbackInfo<v8::Value>& info);

    bool AddOrUpdateTag(const Nan::FunctionCallbackInfo<v8::Value>& info);
    bool DeleteTag(const Nan::FunctionCallbackInfo<v8::Value>& info);
    void GetTag(const Nan::FunctionCallbackInfo<v8::Value>& info);
    void GetNoTagFiles(const Nan::FunctionCallbackInfo<v8::Value>& info);

    bool AddOrUpdateAnnotation(const Nan::FunctionCallbackInfo<v8::Value>& info);
    bool DeleteAnnotation(const Nan::FunctionCallbackInfo<v8::Value>& info);
    void GetAnotation(const Nan::FunctionCallbackInfo<v8::Value>& info);

    void GetTopFiles(const Nan::FunctionCallbackInfo<v8::Value>& info);

  private:
    void Run();

  private:
  };
}

#endif
