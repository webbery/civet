#include <node.h>
#include "civetkern.h"
#include "MessageType.h"
#include "util/util.h"
#include <iostream>
#include <node_api.h>
#include <functional>

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

  typedef struct
  {
    int32_t x;
    int32_t y;
    int32_t PrimeCount;

    int asynchronous_action_status;
    napi_deferred deferred;
    napi_async_work work;
  } prom_data_ex_t;

  void ExecutePromise(napi_env env, void* data) {
    prom_data_ex_t* promDataEx = (prom_data_ex_t*)data;

    // run function
    //
    promDataEx->asynchronous_action_status = 0;
  }

  void CompletePromise(napi_env env, napi_status status, void* data) {
    napi_value rcValue;
    prom_data_ex_t* promDataEx = (prom_data_ex_t*)data;

    napi_create_int32(env, promDataEx->PrimeCount, &rcValue);

    if (promDataEx->asynchronous_action_status == 0) // Success
    {
      status = napi_resolve_deferred(env, promDataEx->deferred, rcValue);
    }
    else
    {
      napi_value undefined;

      status = napi_get_undefined(env, &undefined);
      status = napi_reject_deferred(env, promDataEx->deferred, undefined);
    }
    if (status != napi_ok)
    {
      napi_throw_error(env, NULL, "Unable to create promise result.");
    }

    napi_delete_async_work(env, promDataEx->work);
    free(promDataEx);
  }

  napi_value PromiseFunc(napi_env env, napi_callback_info info)
  {
    napi_value promise;
    napi_status status;
    napi_value argv[2];

    // [in-out] argc: Specifies the size of  argv array and receives the actual count of arguments
    size_t argc = 2;
    status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
    if (status != napi_ok || argc != 2)
    {
      napi_throw_error(env, "EINVAL", "arguments missmatch or Unable to get javacript data");
      return NULL;
    }

    // Allocate storage space for passing informaiton to the Async operation
    prom_data_ex_t* promDataEx = (prom_data_ex_t*)malloc(sizeof(prom_data_ex_t));
    if (promDataEx == NULL)
    {
      napi_throw_error(env, NULL, "Memory allocation error");
      return NULL;
    }

    promDataEx->asynchronous_action_status = 1;


    if ((status = napi_get_value_int32(env, argv[0], &promDataEx->x)) != napi_ok)
    {
      napi_throw_error(env, "EINVAL", "parm 1: int32 expected");
      return NULL;
    }

    if ((status = napi_get_value_int32(env, argv[1], &promDataEx->y)) != napi_ok)
    {
      napi_throw_error(env, "EINVAL", "parm 2: int32 expected");
      return NULL;
    }

    // Create a promise object.
    status = napi_create_promise(env, &promDataEx->deferred, &promise);
    if (status != napi_ok)
    {
      napi_throw_error(env, NULL, "Unable to create promise.");
    }

    napi_valuetype x_type;
    napi_valuetype y_type;

    napi_typeof(env, argv[0], &x_type);
    napi_typeof(env, argv[1], &y_type);
    // Check for the correct calling of the function.
    if (x_type != napi_number || y_type != napi_number)
    {
      // Reject the promise (at least one of the param is not a number)
      napi_value str;
      napi_create_string_utf8(env, "Promise rejected: Argument not a number.", NAPI_AUTO_LENGTH, &str);
      napi_reject_deferred(env, promDataEx->deferred, str);
      free(promDataEx);
    }
    else
    {
      // Create the async function.
      napi_value resource_name;
      napi_create_string_utf8(env, "PromiseFunc", -1, &resource_name);
      napi_create_async_work(env, NULL, resource_name, ExecutePromise, CompletePromise, promDataEx, &promDataEx->work);
      napi_queue_async_work(env, promDataEx->work);
    }

    return promise;
  }

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
        info.GetReturnValue().Set(true);
        return;
      }
    }
    info.GetReturnValue().Set(false);
  }

  void switchDatabase(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios == nullptr) return;
    auto curContext = Nan::GetCurrentContext();
    v8::Local<v8::String> value(info[0]->ToString(curContext).FromMaybe(v8::Local<v8::String>()));
    bool res = Addon::m_pCaxios->SwitchDatabase(ConvertToString(value));
    info.GetReturnValue().Set(res);
  }

  void generateFilesID(const v8::FunctionCallbackInfo<v8::Value>& info) {
    Nan::HandleScope scope;
    if (Addon::m_pCaxios != nullptr) {
      int cnt = ConvertToInt32(info[0]);
      if (cnt <= 0) return;
      Nan::Callback* callback = new Nan::Callback(info[1].As<v8::Function>());

      class PromiseWorker : public Nan::AsyncWorker {
      public:
        PromiseWorker(Nan::Callback* cb, int cnt)
          :Nan::AsyncWorker(cb), _cnt(cnt) {}

        void Execute() {
          _gid = Addon::m_pCaxios->GenNextFilesID(_cnt);
        }

        void HandleOKCallback() {
          Nan::HandleScope scope;

          v8::Local<v8::Array> results = Nan::New<v8::Array>(_gid.size());
          int i = 0;
          for_each(_gid.begin(), _gid.end(),
            [&](int value) {
              Nan::Set(results, i, Nan::New<v8::Uint32>(value));
              i++;
            });

          Local<Value> argv[] = { Nan::Null(), results };
          callback->Call(2, argv);
        }
      private:
        int _cnt;
        std::vector<unsigned int> _gid;
      };
      Nan::AsyncQueueWorker(new PromiseWorker(callback, cnt));

      
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
    using json = nlohmann::json;
    if (Addon::m_pCaxios != nullptr) {
      if (info[0]->IsArray()) {
        v8::Local<v8::Array> arr = info[0].As<v8::Array>();
        json cj;
        for (int i = 0, l = arr->Length(); i < l; i++)
        {
        }
      }
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
