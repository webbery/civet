#include <node.h>
#include "civetkern.h"
#include "MessageType.h"
#include "util/util.h"
#include <iostream>

// https://stackoverflow.com/questions/36659166/nodejs-addon-calling-javascript-callback-from-inside-nan-asyncworkerexecute
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

#define EXPORT_JS_FUNCTION(name) \
  exports->Set(context, \
    String::NewFromUtf8(isolate, #name, v8::NewStringType::kNormal) \
    .ToLocalChecked(), \
    v8::FunctionTemplate::New(isolate, caxios::name, external) \
    ->GetFunction(context).ToLocalChecked()).FromJust()

namespace caxios {
  class Addon {
  public:
    Addon(Isolate* isolate, Local<Object> exports) {
      // 将次对象的实例挂到 exports 上。
      exports_.Reset(isolate, exports);
      exports_.SetWeak(this, DeleteMe, v8::WeakCallbackType::kParameter);
    }

    ~Addon() {
      if (!exports_.IsEmpty()) {
        // 重新设置引用以避免数据泄露。
        exports_.ClearWeak();
        exports_.Reset();
      }
    }

  private:
    // 导出即将被回收时调用的方法。
    static void DeleteMe(const v8::WeakCallbackInfo<Addon>& info) {
      std::cout<<"Delete Me" <<std::endl;
      if (m_pCaxios) {
        delete m_pCaxios;
        m_pCaxios = nullptr;
      }
      delete info.GetParameter();
    }

    // 导出对象弱句柄。该类的实例将与其若绑定的 exports 对象一起销毁。
    v8::Persistent<v8::Object> exports_;

  public:
    // 每个插件的数据
    static CAxios* m_pCaxios;
  };

  CAxios* Addon::m_pCaxios = nullptr;
  
  void release(void* pAxios){
    if (pAxios) {
      delete static_cast<CAxios*>(pAxios);
      pAxios = nullptr;
    }
  }
  void init(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios == nullptr) {
      auto curContext = Nan::GetCurrentContext();
      if (info[0]->IsObject()) {
        v8::Local<v8::Object> obj = info[0]->ToObject(v8::Isolate::GetCurrent());
        Local<Value> localVal = GetValueFromObject(obj, "db.path");
        std::string val = ConvertToString(localVal->ToString(v8::Isolate::GetCurrent()));
        Addon::m_pCaxios = new caxios::CAxios(val);
        node::AddEnvironmentCleanupHook(v8::Isolate::GetCurrent(), caxios::release, Addon::m_pCaxios);
      }
    }
    //info.GetReturnValue().Set((CAxios*)data->m_pCaxios);
  }

  void switchDatabase(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios == nullptr) return;
    auto curContext = Nan::GetCurrentContext();
    v8::Local<v8::String> value(info[0]->ToString(curContext).FromMaybe(v8::Local<v8::String>()));
    bool res = Addon::m_pCaxios->SwitchDatabase(ConvertToString(value));
    info.GetReturnValue().Set(res);
  }

  void generateFilesID(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios != nullptr) {
      int cnt = ConvertToInt32(info[0]);
      if (cnt <= 0) return;
      auto result = Addon::m_pCaxios->GenNextFilesID(cnt);
      Local<v8::Int32Array> arr = v8::Int32Array::New(
        v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), cnt * sizeof(int32_t)), 0, cnt);
      for (int idx = 0; idx < result.size(); ++idx) {
        auto v = v8::Int32::New(v8::Isolate::GetCurrent(), result[idx]);
#if V8_MAJOR_VERSION == 7
        arr->Set(idx, v);
#elif V8_MAJOR_VERSION == 8
        arr->Set(Nan::GetCurrentContext(), idx, v);
#endif
      }
      info.GetReturnValue().Set(arr);
    }
  }

  /**
   * @brief
   * @param info json looks like this:
                 [{
                    fileid: ,
                    filename:'',
                    fullpath:'file:// or http://',
                    filetype:'',
                    thumbnail:'base64',
                    meta: {
                      size: {type: 'value', value: 1024},
                      create_time: {type: 'time', value: 1024}
                    },
                 }]
                 meta数据可以被用来精确查询,因此需要利用B+树，使用值做key，meta的属性作为不同的表，
                 fileid和作为存储的值， 同时文件表存储的meta数据是属性表编号及值ID
   */
  void addFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios != nullptr) {
    }
  }

  void addTags(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void addClasses(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  // void addAnotation(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  // void addKeyword(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void updateFile(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void updateFileTags(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void updateFileClass(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void updateClassName(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void getFilesInfo(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getFilesSnap(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getAllTags(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getUnTagFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getUnClassifyFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getAllClasses(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getTagsOfImages(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void removeFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void removeTags(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void removeClasses(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void searchFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void findFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}

}

NODE_MODULE_INIT() {
  Isolate* isolate = context->GetIsolate();

  // 为该扩展实例的AddonData创建一个新的实例
  caxios::Addon* data = new caxios::Addon(isolate, exports);
  // 在 v8::External 中包裹数据，这样我们就可以将它传递给我们暴露的方法。
  Local<v8::External> external = v8::External::New(isolate, data);

  EXPORT_JS_FUNCTION(init);
  EXPORT_JS_FUNCTION(switchDatabase);
  EXPORT_JS_FUNCTION(generateFilesID);
  EXPORT_JS_FUNCTION(addFiles);
  EXPORT_JS_FUNCTION(addTags);
  EXPORT_JS_FUNCTION(addClasses);
  EXPORT_JS_FUNCTION(updateFile);
  EXPORT_JS_FUNCTION(updateFileTags);
  EXPORT_JS_FUNCTION(updateFileClass);
  EXPORT_JS_FUNCTION(updateClassName);
  EXPORT_JS_FUNCTION(getFilesInfo);
  EXPORT_JS_FUNCTION(getFilesSnap);
  EXPORT_JS_FUNCTION(getAllTags);
  EXPORT_JS_FUNCTION(getUnTagFiles);
  EXPORT_JS_FUNCTION(getUnClassifyFiles);
  EXPORT_JS_FUNCTION(getAllClasses);
  EXPORT_JS_FUNCTION(getTagsOfImages);
  EXPORT_JS_FUNCTION(removeFiles);
  EXPORT_JS_FUNCTION(removeTags);
  EXPORT_JS_FUNCTION(removeClasses);
  EXPORT_JS_FUNCTION(searchFiles);
  EXPORT_JS_FUNCTION(findFiles);
}
