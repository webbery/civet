#include "civetkern.h"
#include <iostream>
#include "util/util.h"
#include "log.h"
#define JS_CLASS_NAME  "Caxios"

using namespace v8;

namespace caxios {

	CAxios::CAxios(const std::string& str) {
    T_LOG("new CAxios(%s)", str.c_str());
    if (m_pDBManager == nullptr) {
      m_pDBManager = new DBManager(str);
    }
  }

  void CAxios::Init(v8::Local<v8::Object> exports)
  {
    this->Wrap(exports);
  }

  std::vector<FileID> CAxios::GenNextFilesID(int cnt)
  {
    return m_pDBManager->GenerateNextFilesID(cnt);
  }

  bool CAxios::AddFiles(const std::vector <std::tuple< FileID, MetaItems, Keywords >>& files)
  {
    return m_pDBManager->AddFiles(files);
  }

  bool CAxios::GetFilesSnap(std::vector<Snap>& snaps)
  {
    return m_pDBManager->GetFilesSnap(snaps);
  }

  bool CAxios::RemoveFiles(const std::vector<FileID>& files)
  {
    return true;
  }

  CAxios::~CAxios() {
    T_LOG("Begin ~CAxios()");
    if (m_pDBManager) {
      delete m_pDBManager;
      m_pDBManager = nullptr;
    }
    T_LOG("Finish ~CAxios()");
  }

  void CAxios::Release(void* data) {
    T_LOG("CAxios::Release()");
    // delete static_cast<CAxios*>(data);
  }

  bool CAxios::AddOrUpdateClass(const Nan::FunctionCallbackInfo<v8::Value>& info) {
    return true;
  }

  void CAxios::GetClass(const Nan::FunctionCallbackInfo<v8::Value>& info)
  {
    CAxios* data =
      reinterpret_cast<CAxios*>(info.Data().As<External>()->Value());
    //data->call_count++;
    //info.GetReturnValue().Set((double)data->call_count);
  }

  void CAxios::Run() {
    // int idx = 0;
    // std::cout<<"---------Run----------\n";
    // while(idx < 60) {
    //   std::this_thread::sleep_for(std::chrono::seconds(1));
    //   std::cout<<"---------work----------\n";
    //   idx++;
    // }
  }
}