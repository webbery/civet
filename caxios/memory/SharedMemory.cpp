#include "SharedMemory.h"

namespace caxios {
  using namespace boost::interprocess;

  CSharedMemory::CSharedMemory() {
    // 检测磁盘空间大小, 优先选择SSD，其次选择大容量硬盘，创建共享内存区
  }

  CSharedMemory::~CSharedMemory() {}

  bool CSharedMemory::Write() {
    return true;
  }
}