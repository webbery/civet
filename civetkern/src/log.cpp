#include "log.h"
#include "lmdb/lmdb.h"
#include <chrono>
#include <ctime>
#include <iostream>
#include <thread>
#if defined(__APPLE__) || defined(__gnu_linux__) || defined(__linux__) 
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <signal.h>
#include <execinfo.h>
#include <pwd.h>
#elif defined(WIN32)
#include <direct.h>
#include <io.h>
#include <process.h>
#include <windows.h>
#include <dbghelp.h>
#include <csignal>
#pragma comment(lib, "dbghelp.lib")
#endif
#ifndef _WIN32
#include <errno.h>
#include <string.h> 
#endif
#include "util/util.h"
#define MAX_TRACE_SIZE  64

namespace caxios {
  std::string err2str(int err) {
    if (err > 0) {
      return strerror(err);
    }
    else {
      return mdb_strerror(err);
    }
  }

  std::string get_file_name(const char* pathname) {
    std::string fullpath(pathname);
#ifdef WIN32
    size_t pos = fullpath.find_last_of('\\');
#else
    size_t pos = fullpath.find_last_of('/');
#endif
    return fullpath.substr(pos + 1, fullpath.size() - pos - 1);
  }

  std::string current()
  {
    using namespace std::chrono;
    auto n = system_clock::now();
    system_clock::duration tp = n.time_since_epoch();
    tp -= duration_cast<seconds>(tp);
    time_t tt = system_clock::to_time_t(n);
    tm t = *gmtime(&tt);
    char buf[64] = { 0 };
    sprintf(buf, "%04u-%02u-%02u %02u:%02u:%02u.%06u", t.tm_year + 1900,
      t.tm_mon + 1, t.tm_mday, t.tm_hour, t.tm_min, t.tm_sec,
      static_cast<unsigned>(tp / std::chrono::microseconds(1)));
    return std::string(buf);
  }

  unsigned int threadid() {
    auto tid = std::this_thread::get_id();
#ifdef _WIN32
    return *(_Thrd_id_t*)&tid;
#elif __APPLE__
    return pthread_mach_thread_np(*(pthread_t*)&tid);
#else
    return *(__gthread_t*)&tid;
#endif
  }

  class FLog {
  public:
    FLog(){
    }
    ~FLog(){
      fclose(_file);
    }

    bool Open(const char* fname, bool flag) {
      std::string logname(fname);
      std::string mode("");
      if (flag == 0) mode = "write";
      int idx = 1;
      std::string filename;
      while (true) {
        filename = logname + std::to_string(idx) + "_" + mode + ".log";
        if (!caxios::exist(filename)) {
          logname = filename;
          break;
        }
        else {
          struct stat statbuf;
          stat(filename.c_str(), &statbuf);
          if (statbuf.st_size < 1024 * 1024 * 1024) {
            break;
          }
        }
        idx += 1;
      }
      std::string root;
#if defined(__APPLE__) || defined(__gnu_linux__) || defined(__linux__)
      root = getenv("HOME");
      if (root.empty()) {
        root = getpwuid(getuid())->pw_dir;
      }
      root += "/.civet";
      if (!exist(root)) {
        createDirectories(root);
      }
      root += "/";
#endif
      _file = fopen((root + filename).c_str(), "a+");
      if (_file) return true;
      return false;
    }

    void Write(const std::string& log) {
      fputs(log.c_str(), _file);
      fflush(_file);
    }

  private:
    bool validateMaxSize() {
      return false;
    }
  private:
    FILE* _file = nullptr; 
  };

  FLog* pLog = nullptr;
  void log2file(const std::string& log)
  {
    if (pLog) pLog->Write(log);
  }

  std::string format_vector(const std::vector<std::string>& vi)
  {
    std::string str;
    for (auto& item : vi)
    {
      str += item;
      str += ",";
    }
    return str;
  }

  std::string format_x16(const std::string& str)
  {
    std::string ret;
    for (char c : str) {
      ret += std::to_string(c);
    }
    return ret;
  }

  bool init_log(bool flag, bool enable) {
    if (enable) {
      pLog = new FLog();
      bool success = pLog->Open("civetkern_", flag);
      if (success) return pLog;
    }
    return false;
  }

  bool log_trace(const char* msg, char** str, int num) {
    FLog log;
    log.Open("dump.txt", true);
    char stack_holder[256] = {0};
    sprintf(stack_holder, "version(%d.%d), process id(%d), thread id(%u)",
      CAXIOS_MAJOR_VERSION, CAXIOS_MINOR_VERSION, getpid(), caxios::threadid());
    log.Write(stack_holder);
    log.Write("\n");
    log.Write(msg);
    for (int i=0;i<num; ++i) {
      log.Write(str[i]);
    }
    log.Write("\n");
    return true;
  }

  bool log_trace(const char* msg)
  {
    FLog log;
    log.Open("dump.txt", true);\
    log.Write(current().c_str());
    log.Write(msg);
    log.Write("\n");
    return true;
  }

#if defined(__APPLE__) || defined(__gnu_linux__) || defined(__linux__) 
  void logStacktrace(int sn) {
    const char* typeMsg = "Unknow Crash:\n";
    usleep(1000 * 1000);
    switch (sn)
    {
    case SIGABRT:
      typeMsg = "SIGABRT:\n";
      break;
    case SIGSEGV:
      typeMsg = "SIGSEGV:\n";
      break;
    case SIGBUS:
      typeMsg = "SIGBUS:\n";
      break;
    case SIGFPE:
      typeMsg = "SIGFPE:\n";
      break;
    case SIGILL:
      typeMsg = "SIGILL:\n";
      break;
    case SIGTRAP:
      typeMsg = "SIGTRAP:\n";
      break;
    default:
      break;
    }
    void* buf[MAX_TRACE_SIZE];
    int cnt = backtrace(buf, MAX_TRACE_SIZE);
    char** symbols = backtrace_symbols(buf, cnt);
    log_trace(typeMsg, symbols, cnt);
    free(symbols);
    signal(SIGABRT, SIG_DFL);
    signal(SIGSEGV, SIG_DFL);
    signal(SIGBUS, SIG_DFL);
    signal(SIGFPE, SIG_DFL);
    signal(SIGILL, SIG_DFL);
    signal(SIGTRAP, SIG_DFL);
  }
#elif defined(WIN32)
  void captureStackTrace(CONTEXT* context, std::vector<uint64_t>& frame_pointers) {
    DWORD machine_type = 0;
    STACKFRAME64 frame = {}; // force zeroing
    frame.AddrPC.Mode = AddrModeFlat;
    frame.AddrFrame.Mode = AddrModeFlat;
    frame.AddrStack.Mode = AddrModeFlat;
#ifdef _M_X64
    frame.AddrPC.Offset = context->Rip;
    frame.AddrFrame.Offset = context->Rbp;
    frame.AddrStack.Offset = context->Rsp;
    machine_type = IMAGE_FILE_MACHINE_AMD64;
#else
    frame.AddrPC.Offset = context->Eip;
    frame.AddrPC.Offset = context->Ebp;
    frame.AddrPC.Offset = context->Esp;
    machine_type = IMAGE_FILE_MACHINE_I386;
#endif
    for (size_t index = 0; index < frame_pointers.size(); ++index)
    {
      if (StackWalk64(machine_type,
        GetCurrentProcess(),
        GetCurrentThread(),
        &frame,
        context,
        NULL,
        SymFunctionTableAccess64,
        SymGetModuleBase64,
        NULL)) {
        frame_pointers[index] = frame.AddrPC.Offset;
      }
      else {
        break;
      }
    }
  }

  std::string getSymbolInformation(const size_t index, const std::vector<uint64_t>& frame_pointers) {
    auto addr = frame_pointers[index];
    std::string frame_dump = "stack dump [" + std::to_string(index) + "]\t";

    DWORD64 displacement64;
    DWORD displacement;
    char symbol_buffer[sizeof(SYMBOL_INFO) + MAX_SYM_NAME];
    SYMBOL_INFO* symbol = reinterpret_cast<SYMBOL_INFO*>(symbol_buffer);
    symbol->SizeOfStruct = sizeof(SYMBOL_INFO);
    symbol->MaxNameLen = MAX_SYM_NAME;

    IMAGEHLP_LINE64 line;
    line.SizeOfStruct = sizeof(IMAGEHLP_LINE64);
    std::string lineInformation;
    std::string callInformation;
    if (SymFromAddr(GetCurrentProcess(), addr, &displacement64, symbol)) {
      callInformation.append(" ").append(std::string(symbol->Name, symbol->NameLen));
      if (SymGetLineFromAddr64(GetCurrentProcess(), addr, &displacement, &line)) {
        lineInformation.append("\t").append(line.FileName).append(" L: ");
        lineInformation.append(std::to_string(line.LineNumber));
      }
    }
    frame_dump.append(lineInformation).append(callInformation);
    return frame_dump;
  }

  std::string convertFramesToText(std::vector<uint64_t>& frame_pointers) {
    std::string dump; // slightly more efficient than ostringstream
    const size_t kSize = frame_pointers.size();
    for (size_t index = 0; index < kSize && frame_pointers[index]; ++index) {
      dump += getSymbolInformation(index, frame_pointers);
      dump += "\n";
    }
    return dump;
  }

  std::string stackdump(CONTEXT* context) {
    const BOOL kLoadSymModules = TRUE;
    const auto initialized = SymInitialize(GetCurrentProcess(), nullptr, kLoadSymModules);
    if (TRUE != initialized) {
      return { "Error: Cannot call SymInitialize(...) for retrieving symbols in stack" };
    }
    std::shared_ptr<void> RaiiSymCleaner(nullptr, [&](void*) {
      SymCleanup(GetCurrentProcess());
      }); // Raii sym cleanup
    const size_t kmax_frame_dump_size = MAX_TRACE_SIZE;
    std::vector<uint64_t>  frame_pointers(kmax_frame_dump_size);
    // C++11: size set and values are zeroed
    assert(frame_pointers.size() == kmax_frame_dump_size);
    captureStackTrace(context, frame_pointers);
    return convertFramesToText(frame_pointers);
  }
  LONG CaxiosCrashHandler(EXCEPTION_POINTERS* pException) {
    std::string dump = "\n***** Received fatal signal *****\n";
    dump += stackdump(pException->ContextRecord);
    log_trace(dump.c_str());
    return EXCEPTION_CONTINUE_SEARCH;
  }

  std::string stackdump() {
    CONTEXT current_context;
    memset(&current_context, 0, sizeof(CONTEXT));
    RtlCaptureContext(&current_context);
    return stackdump(&current_context);
  }

  void signalHandler(int signal_number) {
    std::string dump = "\n***** Received fatal signal *****\n";
    dump += stackdump();
    log_trace(dump.c_str());
    __debugbreak();
  }
  bool g_installed_thread_signal_handler = false;
  void installSignalHandlerForThread() {
    if (!g_installed_thread_signal_handler) {
      g_installed_thread_signal_handler = true;
      if (SIG_ERR == signal(SIGTERM, signalHandler))
        perror("signal - SIGTERM");
      if (SIG_ERR == signal(SIGABRT, signalHandler))
        perror("signal - SIGABRT");
      if (SIG_ERR == signal(SIGFPE, signalHandler))
        perror("signal - SIGFPE");
      if (SIG_ERR == signal(SIGSEGV, signalHandler))
        perror("signal - SIGSEGV");
      if (SIG_ERR == signal(SIGILL, signalHandler))
        perror("signal - SIGILL");
    }
  }

#endif

  void init_trace() {
#if defined(__APPLE__) || defined(UNIX) || defined(__linux__)
    struct sigaction act;
    sigemptyset(&act.sa_mask);
    act.sa_handler = logStacktrace;
    sigemptyset(&act.sa_mask);
    sigaction(SIGABRT, &act, NULL);
    sigaction(SIGSEGV, &act, NULL);
    sigaction(SIGBUS, &act, NULL);
    sigaction(SIGFPE, &act, NULL);
    sigaction(SIGILL, &act, NULL);
    sigaction(SIGTRAP, &act, NULL);
#elif defined(WIN32)
     SetUnhandledExceptionFilter((LPTOP_LEVEL_EXCEPTION_FILTER)CaxiosCrashHandler);
#endif
  }
}