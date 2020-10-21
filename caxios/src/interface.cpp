#include <node.h>
#include "civetkern.h"
#include "MessageType.h"
#include "util/util.h"
#include <iostream>
#include <napi.h>
#include <functional>
#include "json.hpp"
#include "log.h"
#include "Value.h"

// https://stackoverflow.com/questions/36659166/nodejs-addon-calling-javascript-callback-from-inside-nan-asyncworkerexecute
#define EXPORT_JS_FUNCTION_PARAM(name) exports.Set(#name, Napi::Function::New(env, caxios::name));

namespace caxios {
  CAxios* g_pCaxios = nullptr;
  
  Napi::Value release(const Napi::CallbackInfo& info){
    if (g_pCaxios) {
      delete g_pCaxios;
      g_pCaxios = nullptr;
    }
    return info.Env().Undefined();
  }
  Napi::Value init(const Napi::CallbackInfo& info) {
    if (g_pCaxios) return Napi::Value::From(info.Env(), true);
    Napi::Object options = info[0].As<Napi::Object>();
    int32_t flag = 0;
    if (!info[1].IsUndefined()) {
      flag = info[1].As<Napi::Number>().Int32Value();
    }
    std::string defaultName = AttrAsStr(options, "/app/default");
    Napi::Object resource = FindObjectFromArray(options.Get("resources").As<Napi::Object>(), [&defaultName](Napi::Object obj)->bool {
      if (AttrAsStr(obj, "name") == defaultName) return true;
    });
    if (!resource.IsUndefined()) {
      std::string path = AttrAsStr(resource, "/db/path");
      std::string meta;
      if (flag == 0) { // ¶ÁÐ´Ä£Ê½
        meta = Stringify(info.Env(), resource.Get("meta").As<Napi::Object>());
      }
      g_pCaxios = new CAxios(path, flag, meta);
      T_LOG("init success");
    }
    return Napi::Value::From(info.Env(), true);
  }

  Napi::Value generateFilesID(const Napi::CallbackInfo& info) {
    if (g_pCaxios != nullptr) {
      Napi::Number oCnt = info[0].As<Napi::Number>();
      int cnt = oCnt.Int32Value();
      if (cnt <= 0) return Napi::Value();
      std::vector<FileID> gid = g_pCaxios->GenNextFilesID(cnt);
      Napi::Env env = info.Env();
      Napi::Array array = Napi::Array::New(env, gid.size());
      for (unsigned int i = 0; i < gid.size(); ++i) {
        array.Set(i, Napi::Value::From(env, gid[i]));
      }
      return array;
    }
    return info.Env().Undefined();
  }

  /**
   * @brief
   * @param info describe here: https://www.yuque.com/webberg/dacstu/gi9q59#comment-880091
   */
  Napi::Value addFiles(const Napi::CallbackInfo& info) {
    if (g_pCaxios != nullptr) {
      std::vector <std::tuple< FileID, MetaItems, Keywords >> vFiles;
      FileID fileID = 0;
      MetaItems metaItems;
      Keywords keywords;
      std::map<std::string, std::function<void(Napi::Value)> > mMetaProccess;
      mMetaProccess["id"] = [&fileID](Napi::Value item) {
        fileID = AttrAsUint32(item.As<Napi::Object>(), "id");
        //T_LOG("FileID: %d", fileID);
      };
      mMetaProccess["meta"] = [&metaItems](Napi::Value v) {
        Napi::Array array = AttrAsArray(v.As<Napi::Object>(), "meta");
        ForeachArray(array, [&metaItems](Napi::Value item) {
          if (item.IsObject()) {
            MetaItem meta;
            ForeachObject(item, [&meta](const std::string& k, Napi::Value v) {
              auto obj = v.As<Napi::Object>().Get(k);
              std::string sVal;
              if (obj.IsString()) {
                sVal = obj.As<Napi::String>();
              }
              else if (obj.IsNumber()) {
                auto num = obj.As<Napi::Number>().Uint32Value();
                sVal = std::to_string(num);
              }
              else if( obj.IsDate()) {
                double timestamp = obj.As<Napi::Date>().ValueOf();
                sVal = std::to_string(timestamp);
              }
              else if (obj.IsArray()) {
                T_LOG("Is Array: ??");
              }
              meta[k] = sVal;
              //T_LOG("Object: %s, %s", k.c_str(), sVal.c_str());
            });
            metaItems.emplace_back(meta);
          }
          });
      };
      mMetaProccess["keyword"] = [](Napi::Value v) {
      };
      ForeachArray(info[0], [&vFiles, &fileID, &metaItems, &keywords, &mMetaProccess](Napi::Value item) {
        if (item.IsObject()) {
          ForeachObject(item, [&](const std::string& k, Napi::Value v) {
            if (mMetaProccess.find(k) != mMetaProccess.end()) mMetaProccess[k](v);
            else {
              std::cout << "Key [" << k << "] callback not exist.\n";
            }
          });
          vFiles.emplace_back(std::make_tuple(fileID, metaItems,keywords));
        }
      });
      if (!g_pCaxios->AddFiles(vFiles)) {
        T_LOG("addFiles fail");
        return Napi::Boolean::From(info.Env(), false);
      }
      T_LOG("addFiles Success");
      return Napi::Boolean::From(info.Env(), true);
    }
    return Napi::Value();
  }

  Napi::Value setTags(const Napi::CallbackInfo& info) {
    if (g_pCaxios == nullptr) return info.Env().Undefined();
    auto obj = info[0].As<Napi::Object>();
    std::vector<FileID> vFileID = AttrAsUint32Vector(obj, "id");
    std::vector<std::string> vTags = AttrAsStringVector(obj, "tag");
    if (!g_pCaxios->SetTags(vFileID, vTags)) {
      return Napi::Boolean::From(info.Env(), false);
    }
    return Napi::Boolean::From(info.Env(), true);
  }
  Napi::Value addClasses(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
  }
  // void addAnotation(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  // void addKeyword(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  Napi::Value updateFile(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
  }
  Napi::Value updateFileKeywords(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
  }
  Napi::Value updateFileTags(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
  }
  Napi::Value updateFileClass(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
  }
  Napi::Value updateClassName(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
  }

  Napi::Value getFilesInfo(const Napi::CallbackInfo& cbInfo) {
    if (g_pCaxios != nullptr) {
      if (cbInfo[0].IsArray()) {
        Napi::Array aFilesID = cbInfo[0].As<Napi::Array>();
        std::vector< FileInfo > filesInfo;
        std::vector< FileID > filesID;
        ForeachArray(aFilesID, [&filesID](Napi::Value item) {
          FileID fid = item.As<Napi::Number>().Uint32Value();
          filesID.emplace_back(fid);
        });
        bool result = g_pCaxios->GetFilesInfo(filesID, filesInfo);
        Napi::Array array = Napi::Array::New(cbInfo.Env(), filesInfo.size());
        for (unsigned int i = 0; i < filesInfo.size(); ++i) {
          Napi::Object obj = Napi::Object::New(cbInfo.Env());
          auto& info = filesInfo[i];
          obj.Set("id", std::get<0>(info));
          // meta
          auto& metaInfo = std::get<1>(info);
          int metaCnt = metaInfo.size();
          Napi::Array meta = Napi::Array::New(cbInfo.Env(), metaCnt);
          for (unsigned int idx = 0; idx < metaCnt; ++idx) {
            Napi::Object prop = Napi::Object::New(cbInfo.Env());
            for (auto itr = metaInfo[idx].begin(); itr != metaInfo[idx].end(); ++itr) {
              prop.Set(itr->first, itr->second);
            }
            meta.Set(idx, prop);
          }
          obj.Set("meta", meta);
          array.Set(i, obj);
        }
        return array;
      }
    }
    return cbInfo.Env().Undefined();
  }
  Napi::Value getFilesSnap(const Napi::CallbackInfo& info) {
    if (g_pCaxios != nullptr) {
      std::vector<Snap> snaps;
      g_pCaxios->GetFilesSnap(snaps);
      Napi::Array array = Napi::Array::New(info.Env(), snaps.size());
      for (unsigned int i = 0; i < snaps.size(); ++i) {
        auto obj = Napi::Object::New(info.Env());
        obj.Set("id", std::get<0>(snaps[i]));
        obj.Set("display", std::get<1>(snaps[i]));
        obj.Set("step", std::get<2>(snaps[i]));
        array.Set(i, obj);
      }
      return array;
    }
    return info.Env().Undefined();
  }
  Napi::Value getAllTags(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
  }
  Napi::Value getUnTagFiles(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
  }
  Napi::Value getUnClassifyFiles(const Napi::CallbackInfo& info) {
    return Napi::Value();
  }
  Napi::Value getAllClasses(const Napi::CallbackInfo& info) {
    return Napi::Value();
  }
  Napi::Value getTagsOfFiles(const Napi::CallbackInfo& info) {
    return Napi::Value();
  }

  Napi::Value removeFiles(const Napi::CallbackInfo& info) {
    return Napi::Value();
  }
  Napi::Value removeTags(const Napi::CallbackInfo& info) {
    return Napi::Value();
  }
  Napi::Value removeClasses(const Napi::CallbackInfo& info) {
    return Napi::Value();
  }

  Napi::Value searchFiles(const Napi::CallbackInfo& info) {
    return Napi::Value();
  }
  Napi::Value findFiles(const Napi::CallbackInfo& info) {
    if (g_pCaxios != nullptr) {
      if (!info[0].IsUndefined()) {
        auto str = Stringify(info.Env(), info[0].As<Napi::Object>());
        nlohmann::json query = nlohmann::json::parse(str);
        std::vector<FileInfo> vFiles;
        if (g_pCaxios->FindFiles(query, vFiles)) return Napi::Boolean::From(info.Env(), true);
      }
    }
    return Napi::Boolean::From(info.Env(), false);
  }

  Napi::Value flushDisk(const Napi::CallbackInfo& info) {
    return Napi::Value();
  }

  Napi::Value writeLog(const Napi::CallbackInfo& info) {
    if (!info[0].IsUndefined()) {
      std::string str = info[0].As<Napi::String>();
      caxios::log2file(caxios::trunc(str));
    }
    return Napi::Value();
  }
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  EXPORT_JS_FUNCTION_PARAM(init);
  EXPORT_JS_FUNCTION_PARAM(release);
  EXPORT_JS_FUNCTION_PARAM(generateFilesID);
  EXPORT_JS_FUNCTION_PARAM(addFiles);
  EXPORT_JS_FUNCTION_PARAM(setTags);
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
  EXPORT_JS_FUNCTION_PARAM(writeLog);
  return exports;
}

NODE_API_MODULE(civetkern, Init);
