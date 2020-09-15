#include "civetkern.h"
#include <iostream>
#include "util/util.h"

#define JS_CLASS_NAME  "Caxios"

using namespace v8;

namespace caxios {

	//void CAxios::Init(v8::Local<v8::Object> exports)
	//{
	//	v8::Local<v8::Context> context = exports->CreationContext();
	//	Nan::HandleScope scope;

	//	// Prepare constructor template
	//	v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
	//	tpl->SetClassName(Nan::New(JS_CLASS_NAME).ToLocalChecked());
	//	tpl->InstanceTemplate()->SetInternalFieldCount(1);

	//	// Prototype
	//	//Nan::SetPrototypeMethod(tpl, "release", Release);

	//	constructor.Reset(tpl->GetFunction(context).ToLocalChecked());
	//	exports->Set(context,
	//		Nan::New(JS_CLASS_NAME).ToLocalChecked(),
	//		tpl->GetFunction(context).ToLocalChecked());
	//}

	CAxios::CAxios(std::string str) {
    std::cout<< "CAxios()"<<std::endl;
    //node::AddEnvironmentCleanupHook(isolate, Release, nullptr);
//    mdb_env_create(&m_pDBEnv);
//#define MAX_EXPAND_DB_SIZE  50*1024*1024
//    if (const int rc = mdb_env_set_mapsize(m_pDBEnv, MAX_EXPAND_DB_SIZE)) {
//      std::cout << "mdb_env_set_mapsize fail: " << rc << std::endl;
//    }
//    if (const int rc = mdb_env_open(m_pDBEnv, dbpath.c_str(), MDB_NOTLS | MDB_RDONLY, 0664)) {
//      std::cout << "mdb_env_open fail: " << rc << std::endl;
//    }
//    if (const int rc = mdb_txn_begin(m_pDBEnv, parentTransaction, 0, &transaction)) {
//      std::cout << "mdb_txn_begin fail: " << rc << std::endl;
//    }
//    if (const int rc = mdb_dbi_open(transaction, nullptr, 0, &dbi)) {
//      std::cout << "mdb_dbi_open fail: " << rc << std::endl;
//    }
  }

  void CAxios::Init(v8::Local<v8::Object> exports)
  {
    this->Wrap(exports);
  }

  //void CAxios::New(const Nan::FunctionCallbackInfo<v8::Value>& info)
	//{
	//	v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
	//	if (info.IsConstructCall()) {
	//		// Invoked as constructor: `new MyObject(...)`
 //     if (info[0]->IsString()) {
 //       v8::Local<v8::String> value(info[0]->ToString(Nan::GetCurrentContext()).FromMaybe(v8::Local<v8::String>()));
 //       CAxios* obj = new CAxios(ConvertToString(value));
 //       obj->Wrap(info.This());
 //       info.GetReturnValue().Set(info.This());
 //       return;
 //     }
 //     std::cout << "wrong params" << std::endl;
 //   }
	//	else {
	//		// Invoked as plain function `MyObject(...)`, turn into construct call.
	//		const int argc = 1;
	//		v8::Local<v8::Value> argv[argc] = { info[0] };
	//		v8::Local<v8::Function> cons = Nan::New<v8::Function>(constructor);
	//		info.GetReturnValue().Set(
	//			cons->NewInstance(context, argc, argv).ToLocalChecked());
	//	}
	//}

	CAxios::~CAxios() {
    std::cout<< "~CAxios()"<<std::endl;
  }

  void CAxios::Release(void* data) {
    std::cout<< "Begin CAxios::Release()"<<std::endl;
    //mdb_dbi_close(m_pDBEnv, dbi);
    //mdb_env_close(m_pDBEnv);
    delete static_cast<CAxios*>(data);
    std::cout << "Finish CAxios::Release()" << std::endl;
  }

  bool CAxios::AddOrUpdateFiles(const Nan::FunctionCallbackInfo<v8::Value>& info) {
    return true;
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