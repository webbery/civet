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
  
  namespace {
    Napi::Object FileInfo2Object(napi_env env, const FileInfo& info) {
      Napi::Object obj = Napi::Object::New(env);
      obj.Set("id", std::get<0>(info));
      // meta
      auto& metaInfo = std::get<1>(info);
      int metaCnt = metaInfo.size();
      Napi::Array meta = Napi::Array::New(env, metaCnt);
      for (unsigned int idx = 0; idx < metaCnt; ++idx) {
        Napi::Object prop = Napi::Object::New(env);
        for (auto itr = metaInfo[idx].begin(); itr != metaInfo[idx].end(); ++itr) {
          prop.Set(itr->first, itr->second);
        }
        meta.Set(idx, prop);
      }
      obj.Set("meta", meta);
      return obj;
    }
  }

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
    init_log(flag);
    std::string defaultName = AttrAsStr(options, "/app/default");
    Napi::Object resource = FindObjectFromArray(options.Get("resources").As<Napi::Object>(), [&defaultName](Napi::Object obj)->bool {
      if (AttrAsStr(obj, "name") == defaultName) return true;
    });
    if (!resource.IsUndefined()) {
      std::string path = AttrAsStr(resource, "/db/path");
      std::string meta;
      if (flag == 0) { //
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
#if NAPI_VERSION > 5
              else if( obj.IsDate()) {
                double timestamp = obj.As<Napi::Date>().ValueOf();
                sVal = std::to_string(timestamp);
              }
#endif
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
              T_LOG("Key [%s] callback not exist", k.c_str());
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
    if (g_pCaxios == nullptr) return Napi::Boolean::From(info.Env(), false);
    auto obj = info[0].As<Napi::Object>();
    auto ids = AttrAsArray(obj, "id");
    auto tags = AttrAsArray(obj, "tag");
    std::vector<FileID> vFileID = ArrayAsUint32Vector(ids);
    T_LOG("start set tags, input ids: %s", format_vector(vFileID).c_str());
    std::vector<std::string> vTags = ArrayAsStringVector(tags);
    if (!g_pCaxios->SetTags(vFileID, vTags)) {
      return Napi::Boolean::From(info.Env(), false);
    }
    return Napi::Boolean::From(info.Env(), true);
  }
  Napi::Value addClasses(const Napi::CallbackInfo& info) {
    if (g_pCaxios == nullptr) return Napi::Boolean::From(info.Env(), false);
    if (info[0].IsArray()) {
      auto classesName = info[0].As<Napi::Array>();
      std::vector<std::string> vClasses = ArrayAsStringVector(classesName);
      if (!g_pCaxios->AddClasses(vClasses)) {
        return Napi::Boolean::From(info.Env(), false);
      }
      return Napi::Boolean::From(info.Env(), true);
    }
    else if (info[0].IsObject()) {
      auto obj = info[0].As<Napi::Object>();
      auto ids = AttrAsArray(obj, "id");
      auto clsNames = AttrAsArray(obj, "class");
      std::vector<FileID> vFileID = ArrayAsUint32Vector(ids);
      std::vector<std::string> vClasses = ArrayAsStringVector(clsNames);
      if (!g_pCaxios->AddClasses(vClasses, vFileID)) {
        return Napi::Boolean::From(info.Env(), false);
      }
      return Napi::Boolean::From(info.Env(), true);
    }
    return Napi::Boolean::From(info.Env(), false);
  }
  // void addAnotation(const v8::FunctionCallbackInfo<v8::Value>& info) {}
  // void addKeyword(const v8::FunctionCallbackInfo<v8::Value>& info) {}

  Napi::Value updateFile(const Napi::CallbackInfo& info) {
    // 0: query, 1: new value
    if (!g_pCaxios) return Napi::Boolean::From(info.Env(), false);
    auto query = info[0].As<Napi::Object>();
    auto newValue = info[1].As<Napi::Object>();
    return Napi::Boolean::From(info.Env(), true);
  }
  Napi::Value updateFileKeywords(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
  }
  Napi::Value updateFileTags(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
  }
  Napi::Value updateFileClass(const Napi::CallbackInfo& info) {
    if (!g_pCaxios) return Napi::Boolean::From(info.Env(), false);
    auto sql = info[0].As<Napi::Object>();
    auto filesID = AttrAsUint32Vector(sql, "id");
    auto classes = AttrAsStringVector(sql, "class");

    return Napi::Boolean::From(info.Env(), true);
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
          Napi::Object obj = FileInfo2Object(cbInfo.Env(), filesInfo[i]);
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
    if (g_pCaxios) {
      // return {A: [{locale: abaaba, name: tagname, files: [id1, id2, ...]}], ...}
      TagTable vTags;
      g_pCaxios->GetAllTags(vTags);
      Napi::Object allTags = Napi::Object::New(info.Env());
      for (auto& item : vTags) {
        auto& tags = item.second;
        Napi::Array arr = Napi::Array::New(info.Env(), tags.size());
        for (unsigned int idx = 0; idx < tags.size(); ++idx) {
          // {locale: abaaba, name: tagname, files: [id1, id2, ...]}
          Napi::Object tag = Napi::Object::New(info.Env());
          tag.Set("locale", std::get<0>(tags[idx]));
          tag.Set("name", std::get<1>(tags[idx]));
          auto& files = std::get<2>(tags[idx]);
          Napi::Array filesID = Napi::Array::New(info.Env(), files.size());
          for (size_t i = 0; i < files.size(); ++i) {
            filesID.Set(i, files[i]);
          }
          tag.Set("files", filesID);
          arr.Set(idx, tag);
        }
        allTags.Set(std::string(&item.first, 1), arr);
      }
      return allTags;
    }
    return info.Env().Undefined();
  }
  Napi::Value getUnTagFiles(const Napi::CallbackInfo& info) {
    if (g_pCaxios) {
      std::vector<FileID> vFilesID;
      if (!g_pCaxios->GetUntagFiles(vFilesID)) {
        T_LOG("get untag file fail");
      }
      else {
        T_LOG("get untag file");
      }
      Napi::Env env = info.Env();
      Napi::Array array = Napi::Array::New(env, vFilesID.size());
      for (unsigned int i = 0; i < vFilesID.size(); ++i) {
        array.Set(i, Napi::Value::From(env, vFilesID[i]));
      }
      return array;
    }
    return info.Env().Undefined();
  }
  Napi::Value getUnClassifyFiles(const Napi::CallbackInfo& info) {
    if (g_pCaxios) {
      std::vector<FileID> vFilesID;
      g_pCaxios->GetUnclassifyFiles(vFilesID);
      Napi::Env env = info.Env();
      Napi::Array array = Napi::Array::New(env, vFilesID.size());
      for (unsigned int i = 0; i < vFilesID.size(); ++i) {
        array.Set(i, Napi::Value::From(env, vFilesID[i]));
      }
      return array;
    }
    return info.Env().Undefined();
  }
  Napi::Value getAllClasses(const Napi::CallbackInfo& info) {
    if (g_pCaxios) {
      Classes classes;
      g_pCaxios->GetAllClasses(classes);
      Napi::Env env = info.Env();
      Napi::Array array = Napi::Array::New(env, classes.size());
      for (unsigned int i = 0; i < classes.size(); ++i) {
        array.Set(i, Napi::Value::From(env, classes[i]));
      }
      return array;
    }
    return Napi::Value();
  }
  Napi::Value getTagsOfFiles(const Napi::CallbackInfo& info) {
    T_LOG("get tag");
    if (g_pCaxios) {
      Napi::Object obj = info[0].As<Napi::Object>();
      auto aFilesID = AttrAsArray(obj, "id");
      std::vector<FileID> vFilesID = ArrayAsUint32Vector(aFilesID);
      std::vector<Tags> vTags;
      T_LOG("get tag 2");
      g_pCaxios->GetTagsOfFiles(vFilesID, vTags);
      Napi::Array array = Napi::Array::New(info.Env(), vTags.size());
      return array;
    }
    return Napi::Value();
  }

  Napi::Value removeFiles(const Napi::CallbackInfo& info) {
    if (g_pCaxios) {
      auto arr = info[0].As<Napi::Array>();
      std::vector<FileID> vFilesID(arr.Length());
      for (unsigned int i = 0; i < arr.Length(); i++) {
        vFilesID[i] = AttrAsUint32(arr, i);
      }
      if (g_pCaxios->RemoveFiles(vFilesID)) {
        T_LOG("Remove files finish");
        return Napi::Boolean::From(info.Env(), true);
      }
    }
    return Napi::Boolean::From(info.Env(), false);
  }
  Napi::Value removeTags(const Napi::CallbackInfo& info) {
    if (g_pCaxios) {
      return Napi::Boolean::From(info.Env(), true);
    }
    return Napi::Boolean::From(info.Env(), false);
  }
  Napi::Value removeClasses(const Napi::CallbackInfo& info) {
    if (g_pCaxios) {
      return Napi::Boolean::From(info.Env(), true);
    }
    return Napi::Boolean::From(info.Env(), false);
  }

  Napi::Value searchFiles(const Napi::CallbackInfo& info) {
    if (g_pCaxios) {
      auto str = Stringify(info.Env(), info[0].As<Napi::Object>());
      nlohmann::json query = nlohmann::json::parse(str);
      std::vector<FileInfo> vFiles;
    }
    return Napi::Value();
  }
  
  Napi::Value findFiles(const Napi::CallbackInfo& info) {
    if (g_pCaxios != nullptr) {
      if (!info[0].IsUndefined()) {
        auto str = Stringify(info.Env(), info[0].As<Napi::Object>());
        nlohmann::json query = nlohmann::json::parse(str);
        std::vector<FileInfo> vFiles;
        g_pCaxios->FindFiles(query, vFiles);
        Napi::Env env = info.Env();
        Napi::Array array = Napi::Array::New(env, vFiles.size());
        for (unsigned int i = 0; i < vFiles.size(); ++i) {
          Napi::Object obj = FileInfo2Object(env, vFiles[i]);
          array.Set(i, Napi::Value::From(env, obj));
        }
        return array;
      }
    }
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
  EXPORT_JS_FUNCTION_PARAM(setTags);            // 否决的
  EXPORT_JS_FUNCTION_PARAM(addClasses);
  EXPORT_JS_FUNCTION_PARAM(updateFile);
  EXPORT_JS_FUNCTION_PARAM(updateFileKeywords); // 否决的
  EXPORT_JS_FUNCTION_PARAM(updateFileTags);     // 否决的
  EXPORT_JS_FUNCTION_PARAM(updateFileClass);    // 否决的
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
  EXPORT_JS_FUNCTION_PARAM(writeLog);
  return exports;
}

NODE_API_MODULE(civetkern, Init);
