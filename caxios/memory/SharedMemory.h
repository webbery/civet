#ifndef _CAXIOS_H_
#define _CAXIOS_H_
#include <filesystem>
#include <boost/interprocess/managed_shared_memory.hpp>
#include <boost/interprocess/allocators/allocator.hpp>
#include <boost/interprocess/containers/map.hpp>
#include <boost/interprocess/containers/vector.hpp>
#include <boost/interprocess/containers/string.hpp>

namespace caxios{
  class CSharedMemory {
  public:
    CSharedMemory();
    ~CSharedMemory();

    bool Write();

  private:
    struct shm_remove
    {
      shm_remove() { shared_memory_object::remove("AxiosSharedMemory"); }
      ~shm_remove(){ shared_memory_object::remove("AxiosSharedMemory"); }
    };

    shm_remove* m_pSHM = nullptr;
  }
}

#endif
