#include <node.h>
#include "civetkern.h"
#include "MessageType.h"
#include "util/util.h"
#include <iostream>
#include <node_api.h>
//#include <napi.h>
#include <functional>
#include "json.hpp"
#include "log.h"

// https://stackoverflow.com/questions/36659166/nodejs-addon-calling-javascript-callback-from-inside-nan-asyncworkerexecute
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

#define EXPORT_JS_FUNCTION_PARAM(name) \
  exports->Set(context, \
    String::NewFromUtf8(isolate, #name, v8::NewStringType::kNormal) \
    .ToLocalChecked(), \
    v8::FunctionTemplate::New(isolate, caxios::name, external) \
    ->GetFunction(context).ToLocalChecked()).FromJust()

#define EXPORT_JS_FUNCTION(name) \
  exports->Set(context, \
    String::NewFromUtf8(isolate, #name, v8::NewStringType::kNormal) \
    .ToLocalChecked(), \
    v8::FunctionTemplate::New(isolate, caxios::name) \
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
#if V8_MAJOR_VERSION == 7
        v8::Local<v8::Object> obj = info[0]->ToObject(v8::Isolate::GetCurrent());
#elif V8_MAJOR_VERSION == 8
        v8::Local<v8::Object> obj = info[0]->ToObject(v8::Isolate::GetCurrent()->GetCurrentContext()).ToLocalChecked();
#endif
        int flag = 0;
        if (!info[1]->IsUndefined()) {
          flag = ConvertToInt32(info[1]);
        }
        std::string sConfig = Stringify(obj);
        nlohmann::json config = nlohmann::json::parse(sConfig);
        std::string defaultName = config["/app/default"_json_pointer].dump();
        auto resources = config["/resources"_json_pointer];
        for (auto item: resources)
        {
          if (item["name"].dump() == defaultName) {
            std::string dbPath = item["/db/path"_json_pointer].dump();
            std::string meta = item["meta"].dump();
            Addon::m_pCaxios = new caxios::CAxios(trunc(dbPath), flag, meta);
            node::AddEnvironmentCleanupHook(v8::Isolate::GetCurrent(), caxios::release, Addon::m_pCaxios);
            T_LOG("init success");
            info.GetReturnValue().Set(true);
            return;
          }
        }
      }
    }
    T_LOG("init fail");
    info.GetReturnValue().Set(false);
  }

  void generateFilesID(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios != nullptr) {
      int cnt = ConvertToInt32(info[0]);
      if (cnt <= 0) return;
      std::vector<FileID> gid = Addon::m_pCaxios->GenNextFilesID(cnt);
      v8::Local<v8::Array> results = ConvertFromArray(gid);
      info.GetReturnValue().Set(results);
    }
  }

  /**
   * @brief
   * @param info describe here: https://www.yuque.com/webberg/dacstu/gi9q59#comment-880091
   */
  void addFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios != nullptr) {
      std::vector <std::tuple< FileID, MetaItems, Keywords >> vFiles;
      FileID fileID = 0;
      MetaItems metaItems;
      Keywords keywords;
      std::map<std::string, std::function<void(const v8::Local<v8::Value>&)> > mMetaProccess;
      mMetaProccess["fileid"] = [&fileID](const v8::Local<v8::Value>& v) {
        fileID = ConvertToUInt32(v);
      };
      mMetaProccess["meta"] = [&metaItems](const v8::Local<v8::Value>& v) {
        if (v->IsArray()) {
          ForeachArray(v, [&metaItems](const v8::Local<v8::Value>& item) {
            if (item->IsObject()) {
              MetaItem meta;
              ForeachObject(item, [&meta](const v8::Local<v8::Value>& k, const v8::Local<v8::Value>& v) {
                std::string sKey = ConvertToString(k);
                std::string sVal = ConvertToString(v);
                meta[sKey] = sVal;
                //std::cout << sKey << ": " << sVal << std::endl;
              });
              metaItems.emplace_back(meta);
            }
          });
        }
      };
      mMetaProccess["keyword"] = [](const v8::Local<v8::Value>& v) {
      };
      ForeachArray(info[0], [&vFiles, &fileID, &metaItems, &keywords, &mMetaProccess](const v8::Local<v8::Value>& item) {
        if (item->IsObject()) {
          ForeachObject(item, [&](const v8::Local<v8::Value>& k, const v8::Local<v8::Value>& v) {
            std::string sKey = ConvertToString(k);
            if (mMetaProccess.find(sKey) != mMetaProccess.end()) mMetaProccess[sKey](v);
            else {
              std::cout << "Key [" << sKey << "] callback not exist.\n";
            }
          });
          vFiles.emplace_back(std::make_tuple(fileID, metaItems,keywords));
        }
      });
      if (!Addon::m_pCaxios->AddFiles(vFiles)) {
        T_LOG("addFiles fail");
        info.GetReturnValue().Set(false);
        return;
      }
      info.GetReturnValue().Set(true);
    }
  }

  void addTags(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios != nullptr) {
    }
  }
  void addClasses(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  // void addAnotation(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  // void addKeyword(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void updateFile(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void updateFileKeywords(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void updateFileTags(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void updateFileClass(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void updateClassName(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void getFilesInfo(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios != nullptr) {
      if (info[0]->IsArray()) {
        std::vector<FileID> filesID = ConvertToArray<FileID>(info[0]);
        std::vector< FileInfo > filesInfo;
        bool result = Addon::m_pCaxios->GetFilesInfo(filesID, filesInfo);
        auto arr = ConvertFromArray(filesInfo);
        info.GetReturnValue().Set(arr);
      }
    }
  }
  void getFilesSnap(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios != nullptr) {
      std::vector<Snap> snaps;
      Addon::m_pCaxios->GetFilesSnap(snaps);
      v8::Local<v8::Array> arr = ConvertFromArray(snaps);
      info.GetReturnValue().Set(arr);
    }
  }
  void getAllTags(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getUnTagFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getUnClassifyFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getAllClasses(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void getTagsOfFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void removeFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {
    if (Addon::m_pCaxios != nullptr) {
    }
  }
  void removeTags(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void removeClasses(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void searchFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  void findFiles(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  void flushDisk(const v8::FunctionCallbackInfo<v8::Value>& info) {}
}

NODE_MODULE_INIT() {
  Isolate* isolate = context->GetIsolate();

  // 为该扩展实例的AddonData创建一个新的实例
  caxios::Addon* data = new caxios::Addon(isolate, exports);
  // 在 v8::External 中包裹数据，这样我们就可以将它传递给我们暴露的方法。
  Local<v8::External> external = v8::External::New(isolate, data);

  EXPORT_JS_FUNCTION_PARAM(init);
  EXPORT_JS_FUNCTION_PARAM(generateFilesID);
  EXPORT_JS_FUNCTION_PARAM(addFiles);
  EXPORT_JS_FUNCTION_PARAM(addTags);
  EXPORT_JS_FUNCTION_PARAM(addClasses);
  EXPORT_JS_FUNCTION_PARAM(updateFile);
  EXPORT_JS_FUNCTION_PARAM(updateFileKeywords);
  EXPORT_JS_FUNCTION_PARAM(updateFileTags);
  EXPORT_JS_FUNCTION_PARAM(updateFileClass);
  EXPORT_JS_FUNCTION_PARAM(updateClassName);
  EXPORT_JS_FUNCTION_PARAM(getFilesInfo);
  EXPORT_JS_FUNCTION_PARAM(getFilesSnap);
  EXPORT_JS_FUNCTION_PARAM(getAllTags);
  EXPORT_JS_FUNCTION_PARAM(getUnTagFiles);
  EXPORT_JS_FUNCTION_PARAM(getUnClassifyFiles);
  EXPORT_JS_FUNCTION_PARAM(getAllClasses);
  EXPORT_JS_FUNCTION_PARAM(getTagsOfFiles);
  EXPORT_JS_FUNCTION_PARAM(removeFiles);
  EXPORT_JS_FUNCTION_PARAM(removeTags);
  EXPORT_JS_FUNCTION_PARAM(removeClasses);
  EXPORT_JS_FUNCTION_PARAM(searchFiles);
  EXPORT_JS_FUNCTION_PARAM(findFiles);
  EXPORT_JS_FUNCTION_PARAM(flushDisk);
}
