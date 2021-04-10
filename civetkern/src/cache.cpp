#include "cache.h"
#include <mutex>

namespace caxios {
  namespace {
    Cache* g_cache = nullptr;
  }

  Cache* Cache::GetInstance()
  {
    //static std::once_flag oc;
    //std::call_once(oc, [&]() {
    //  g_cache = new Cache();
    //  });
    //return g_cache;
  }

  Cache::~Cache()
  {
    //UnmapViewOfFile(m_pBuffer);
    //CloseHandle(m_pHandle);
  }

  Cache::Cache()
  {
    //m_pHandle = OpenFileMapping(FILE_MAP_ALL_ACCESS, NULL, "SHMCivet");
    //if (m_pHandle) {
    //  m_pBuffer = MapViewOfFile(m_pHandle, FILE_MAP_ALL_ACCESS, 0, 0, 0);
    //}
  }
}
