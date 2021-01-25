#include <node.h>
#include "civetkern.h"
#include "MessageType.h"
#include "util/util.h"
#include <iostream>
#include <napi.h>
#include <functional>
#include <locale.h>
#include "json.hpp"
#include "log.h"
#if defined(__APPLE__) || defined(__gnu_linux__) || defined(__linux__) 
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#elif defined(WIN32)
#include <direct.h>
#include <io.h>
#endif

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
          if (itr->second[0] == '^') { // datetime
            std::string num = itr->second.substr(1);
            if (isNumber(num)) {
              double dTime = atof(num.c_str());
#if NAPI_VERSION >= 5
              auto date = Napi::Date::New(env, dTime);
              prop.Set(itr->first, date);
#endif
              T_LOG("file", "date %f", dTime);
            }
          }
          else {
            prop.Set(itr->first, itr->second);
          }
        }
        meta.Set(idx, prop);
      }
      obj.Set("meta", meta);
      // tags
      auto& tagsInfo = std::get<2>(info);
      Napi::Array tags = Vector2Array(env, tagsInfo);
      obj.Set("tag", tags);
      // class
      Napi::Array classes = Vector2Array(env, std::get<3>(info));
      obj.Set("class", classes);
      // keyword
      Napi::Array keywords = Vector2Array(env, std::get<5>(info));
      obj.Set("keyword", keywords);
      return obj;
    }

    Napi::Value Classes2Array(napi_env env, const nlohmann::json& vClasses) {
      T_LOG("interface", "classes json: %s", vClasses.dump().c_str());
      int addition = 0;
      if (vClasses.find("type") != vClasses.end()) {
        addition = -1;
      }
      if (addition == -1 && vClasses.size() == 1) {
        return Napi::Value();
      }
      else if (vClasses.is_string() && vClasses.get<std::string>() == "type") {
        return Napi::Value();
      }
      if (vClasses.is_object()) {
        size_t pos = 0;
        Napi::Array array = Napi::Array::New(env, vClasses.size() + addition);
        for (auto itr = vClasses.begin(); itr != vClasses.end(); ++itr) {
          T_LOG("interface", "classes json key: %s", itr.key().c_str());
          if (itr.key() == "type") continue;
          Napi::Object cls = Napi::Object::New(env);
          if (itr.key() == "children") {
            auto& item = itr.value();
            if (item.size()) {
              Napi::Value children = Classes2Array(env, item);
              //Napi::Array children = Napi::Array::New(env, item.size());
              //size_t idx = 0;
              //for (auto ptr = item.begin(); ptr != item.end(); ++ptr)
              //{
              //  if (ptr->is_object()) {
              //    Napi::Value child = Classes2Array(env, ptr.value());
              //    children.Set(idx, child);
              //  }
              //  else {
              //    T_LOG("class size obj %d: %d", item.size(), ptr.value().get<FileID>());
              //    children.Set(idx, ptr.value().get<FileID>());
              //  }
              //  ++idx;
              //}
              cls.Set("children", children);
            }
          }
          else {
            cls.Set("name", itr.key());
            cls.Set("type", "clz");
            Napi::Value children = Classes2Array(env, itr.value());
            if (!children.IsUndefined()) {
              cls.Set("children", children.As<Napi::Array>());
            }
          }
          array.Set(pos, cls);
          pos += 1;
        }
        return array;
      }
      else if (vClasses.is_array()) { // array
        size_t pos = 0;
        Napi::Array array = Napi::Array::New(env, vClasses.size());
        for (auto ptr = vClasses.begin(); ptr != vClasses.end(); ++ptr) {
          if (ptr->is_number()) {
            array.Set(pos, ptr->get<FileID>());
          }
        }
        return array;
      }
      return Napi::Value();
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
    //setlocale(LC_ALL, "");
    Napi::Object options = info[0].As<Napi::Object>();
    int32_t readOnly = 0;
    if (!info[1].IsUndefined()) {
      readOnly = info[1].As<Napi::Number>().Int32Value();
    }
    bool enableLog = true;
    if (!info[2].IsUndefined()) {
      enableLog = info[2].As<Napi::Boolean>();
    }
    init_log(readOnly, enableLog);
    std::string defaultName = AttrAsStr(options, "/app/default");
    Napi::Object resource = FindObjectFromArray(options.Get("resources").As<Napi::Object>(), [&defaultName](Napi::Object obj)->bool {
      if (AttrAsStr(obj, "name") == defaultName) return true;
    });
    if (!resource.IsUndefined()) {
      std::string path = AttrAsStr(resource, "/db/path");
      if (readOnly != 0 &&
#if defined(__APPLE__) || defined(UNIX) || defined(__linux__)
        access(path.c_str(), 0) != 0
#elif defined(WIN32)
        _access(path.c_str(), 0) == ENOENT
#endif
      ) {
        Napi::Error::New(info.Env(), "db file(" + path + ") not exist")
          .ThrowAsJavaScriptException();
        return Napi::Value::From(info.Env(), false);
      }
      std::string meta = Stringify(info.Env(), resource.Get("meta").As<Napi::Object>());
      T_LOG("init", "schema: %s", meta.c_str());
      g_pCaxios = new CAxios(path, readOnly, meta);
      T_LOG("interface", "init success");
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
      auto env = info.Env();
      std::vector <std::tuple< FileID, MetaItems, Keywords >> vFiles;
      FileID fileID = 0;
      MetaItems metaItems;
      Keywords keywords;
      std::map<std::string, std::function<void(Napi::Value)> > mMetaProccess;
      mMetaProccess["id"] = [&fileID](Napi::Value item) {
        fileID = AttrAsUint32(item.As<Napi::Object>(), "id");
        //T_LOG("FileID: %d", fileID);
      };
      mMetaProccess["meta"] = [&metaItems, &env](Napi::Value v) {
        Napi::Array array = AttrAsArray(v.As<Napi::Object>(), "meta");
        //std::string sArr = Stringify(env, array);
        //T_LOG("file", "process meta: %s", sArr.c_str());
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
#if NAPI_VERSION >= 5
              else if( obj.IsDate()) {
                //std::string sVal = obj.As<Napi::Date>().As<Napi::String>();
                double timestamp = obj.As<Napi::Date>().ValueOf();
                sVal = std::string("^") + std::to_string(timestamp);
                T_LOG("file", "add file, date value: %s", sVal.c_str());
              }
#endif
              else if (obj.IsArray()) {
                T_LOG("interface", "Is Array: ??");
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
          metaItems.clear();
          ForeachObject(item, [&](const std::string& k, Napi::Value v) {
            if (mMetaProccess.find(k) != mMetaProccess.end()) mMetaProccess[k](v);
            else {
              T_LOG("interface", "Key [%s] callback not exist", k.c_str());
            }
          });
          vFiles.emplace_back(std::make_tuple(fileID, metaItems,keywords));
        }
      });
      if (!g_pCaxios->AddFiles(vFiles)) {
        T_LOG("interface", "addFiles fail");
        return Napi::Boolean::From(info.Env(), false);
      }
      T_LOG("interface", "addFiles Success");
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
    std::vector<std::string> vTags = ArrayAsStringVector(tags);
    T_LOG("interface", "start set tags, input file ids: %s, tags: %s", format_vector(vFileID).c_str(), format_vector(vTags).c_str());
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
      T_LOG("interface", "add files to classes");
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
    auto obj = info[0].As<Napi::Object>();
    auto filesID = AttrAsUint32Vector(obj, "id");
    auto props = obj.GetPropertyNames();
    nlohmann::json meta;
    for (int idx = 1; idx<props.Length(); ++idx)
    {
      std::string key = props.Get(idx).As<Napi::String>();
      auto value = obj.Get(key);
      if (value.IsString()) {
        std::string s = value.As<Napi::String>();
        T_LOG("file", "string: %s", s.c_str());
        meta[key] = s;
      }
      else {
        T_LOG("file", "unknow meta, key: %s", key.c_str());
      }
    }
    T_LOG("file", "mutation: %s", meta.dump().c_str());
    g_pCaxios->UpdateFileMeta(filesID, meta);
    return Napi::Boolean::From(info.Env(), true);
  }
  Napi::Value updateFileKeywords(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
  }
  Napi::Value updateFileTags(const Napi::CallbackInfo& info) {
    if (g_pCaxios) {
      auto obj = info[0].As<Napi::Object>();
      auto filesID = AttrAsUint32Vector(obj, "id");
      auto tags = AttrAsStringVector(obj, "tag");
      g_pCaxios->SetTags(filesID, tags);
    }
    return info.Env().Undefined();
  }
  Napi::Value updateFileClass(const Napi::CallbackInfo& info) {
    if (!g_pCaxios) return Napi::Boolean::From(info.Env(), false);
    auto sql = info[0].As<Napi::Object>();
    auto filesID = AttrAsUint32Vector(sql, "id");
    auto classes = AttrAsStringVector(sql, "class");
    bool result = g_pCaxios->UpdateFilesClasses(filesID, classes);
    return Napi::Boolean::From(info.Env(), result);
  }
  Napi::Value updateClassName(const Napi::CallbackInfo& info) {
    if (!g_pCaxios) return Napi::Boolean::From(info.Env(), false);
    std::string oldName = info[0].As<Napi::String>();
    std::string newName = info[1].As<Napi::String>();
    bool result = g_pCaxios->UpdateClassName(oldName, newName);
    return Napi::Boolean::From(info.Env(), result);
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
        T_LOG("interface", "files info %s", format_vector(filesID).c_str());
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
        T_LOG("interface", "get untag file fail");
      }
      else {
        T_LOG("interface", "get untag file");
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
  Napi::Value getClasses(const Napi::CallbackInfo& info) {
    if (g_pCaxios) {
      std::string sParent("/");
      if (info.Length() != 0) {
        sParent = info[0].As<Napi::String>();
      }
      T_LOG("class", "get classes");
      nlohmann::json classes = nlohmann::json::array();
      g_pCaxios->GetClasses(sParent, classes);
      Napi::Env env = info.Env();
      return Parse(env, classes.dump());
      //auto arry = Classes2Array(env, classes);
      //return arry;
    }
    return Napi::Value();
  }
  Napi::Value getTagsOfFiles(const Napi::CallbackInfo& info) {
    if (g_pCaxios) {
      Napi::Object obj = info[0].As<Napi::Object>();
      auto aFilesID = AttrAsArray(obj, "id");
      std::vector<FileID> vFilesID = ArrayAsUint32Vector(aFilesID);
      std::vector<Tags> vTags;
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
        T_LOG("interface", "Remove files finish");
        return Napi::Boolean::From(info.Env(), true);
      }
    }
    return Napi::Boolean::From(info.Env(), false);
  }
  Napi::Value removeTags(const Napi::CallbackInfo& info) {
    if (g_pCaxios) {
      Napi::Object obj = info[0].As<Napi::Object>();
      auto aFilesID = AttrAsUint32Vector(obj, "id");
      auto aTags = AttrAsStringVector(obj, "tag");
      bool result = g_pCaxios->RemoveTags(aFilesID, aTags);
      return Napi::Boolean::From(info.Env(), result);
    }
    return Napi::Boolean::From(info.Env(), false);
  }
  Napi::Value removeClasses(const Napi::CallbackInfo& info) {
    if (g_pCaxios) {
      bool result = false;
      if (info[0].IsArray()) {
        Napi::Array arr = info[0].As<Napi::Array>();
        auto classes = ArrayAsStringVector(arr);
        result = g_pCaxios->RemoveClasses(classes);
      }
      else if (info[0].IsObject()) {
        Napi::Object obj = info[0].As<Napi::Object>();
        auto aFilesID = AttrAsUint32Vector(obj, "id");
        auto aClasses = AttrAsStringVector(obj, "class");
        result = g_pCaxios->RemoveClasses(aClasses, aFilesID);
      }
      return Napi::Boolean::From(info.Env(), result);
    }
    return Napi::Boolean::From(info.Env(), false);
  }

  Napi::Value query(const Napi::CallbackInfo& info) {
    if (g_pCaxios != nullptr) {
      if (!info[0].IsUndefined()) {
        auto str = Stringify(info.Env(), info[0].As<Napi::Object>());
        try {
          std::vector<FileInfo> vFiles;
          g_pCaxios->Query(str, vFiles);
          Napi::Env env = info.Env();
          Napi::Array array = Napi::Array::New(env, vFiles.size());
          for (unsigned int i = 0; i < vFiles.size(); ++i) {
            Napi::Object obj = FileInfo2Object(env, vFiles[i]);
            array.Set(i, Napi::Value::From(env, obj));
          }
          return array;
        }
        catch (const std::exception& e) {
          T_LOG("query", "exception: %s", e.what());
          return Napi::String::From(info.Env(), e.what());
        }
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
  EXPORT_JS_FUNCTION_PARAM(setTags);            // depreciate
  EXPORT_JS_FUNCTION_PARAM(addClasses);
  EXPORT_JS_FUNCTION_PARAM(updateFile);
  EXPORT_JS_FUNCTION_PARAM(updateFileKeywords); // depreciate
  EXPORT_JS_FUNCTION_PARAM(updateFileTags);     // depreciate
  EXPORT_JS_FUNCTION_PARAM(updateFileClass);    // depreciate
  EXPORT_JS_FUNCTION_PARAM(updateClassName);
  EXPORT_JS_FUNCTION_PARAM(getFilesInfo);
  EXPORT_JS_FUNCTION_PARAM(getFilesSnap);
  EXPORT_JS_FUNCTION_PARAM(getAllTags);
  EXPORT_JS_FUNCTION_PARAM(getUnTagFiles);
  EXPORT_JS_FUNCTION_PARAM(getUnClassifyFiles);
  EXPORT_JS_FUNCTION_PARAM(getClasses);
  EXPORT_JS_FUNCTION_PARAM(getTagsOfFiles);
  EXPORT_JS_FUNCTION_PARAM(removeFiles);
  EXPORT_JS_FUNCTION_PARAM(removeTags);
  EXPORT_JS_FUNCTION_PARAM(removeClasses);
  EXPORT_JS_FUNCTION_PARAM(query);
  EXPORT_JS_FUNCTION_PARAM(writeLog);
  return exports;
}

NODE_API_MODULE(civetkern, Init);
