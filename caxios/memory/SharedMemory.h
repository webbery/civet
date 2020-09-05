#ifndef _SHAREDMEMORY_H_
#define _SHAREDMEMORY_H_
#include <filesystem>
#include <boost/interprocess/managed_shared_memory.hpp>
#include <boost/interprocess/allocators/allocator.hpp>
#include <boost/interprocess/containers/map.hpp>
#include <boost/interprocess/containers/vector.hpp>
#include <boost/interprocess/containers/string.hpp>

namespace caxios{

#define SHARED_MEMORY_NAME  "AxiosSharedMemory"

  using namespace boost::interprocess;
  
  class CSharedMemory {
  public:
    CSharedMemory();
    ~CSharedMemory();

    bool Write();

  private:
    struct shm_remove
    {
      shm_remove() { shared_memory_object::remove(SHARED_MEMORY_NAME); }
      ~shm_remove(){ shared_memory_object::remove(SHARED_MEMORY_NAME); }
    };

    shm_remove* m_pSHM = nullptr;
  };
}

#endif
