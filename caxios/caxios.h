#ifndef _CAXIOS_H_
#define _CAXIOS_H_
#include <string>

namespace caxios {
  class CAxios {
  public:
    CAxios();
    ~CAxios();

    void Release();

    bool AddOrUpdateClass(const std::string& );
    bool DeleteClass(const std::string& );
    void GetClass();
    void GetNoClassifyFiles();

    bool AddOrUpdateTag();
    bool DeleteTag();
    void GetTag();
    void GetNoTagFiles();

    bool AddOrUpdateAnnotation();
    bool DeleteAnnotation();
    void GetAnotation();

    void GetTopFiles();

  private:


  private:
  };
}

#endif
