#include "civetkern.h"
#include <iostream>
#include "util/util.h"
#define JS_CLASS_NAME  "Caxios"

using namespace v8;

namespace caxios {

	CAxios::CAxios(const std::string& str) {
    std::cout<< "CAxios("<< str <<")"<<std::endl;
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
    std::cout << "~CAxios(1)" << std::endl;
    if (m_pDBManager) {
      delete m_pDBManager;
      m_pDBManager = nullptr;
    }
    std::cout << "~CAxios(2)" << std::endl;
  }

  void CAxios::Release(void* data) {
    std::cout<< "Begin CAxios::Release()"<<std::endl;
    // delete static_cast<CAxios*>(data);
    std::cout << "Finish CAxios::Release()" << std::endl;
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