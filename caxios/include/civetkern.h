#ifndef _CAXIOS_H_
#define _CAXIOS_H_
#include <node.h>
#include <node_object_wrap.h>
#include <string>
#include "db_manager.h"
#include "datum_type.h"
#include "QueryParser.h"

namespace caxios{
  class CAxios {
  public:
    explicit CAxios(const std::string& str, int flag, const std::string& meta = "");
    ~CAxios();

    std::vector<FileID> GenNextFilesID(int cnt = 1);
    bool AddFiles(const std::vector <std::tuple< FileID, MetaItems, Keywords >>& files);
    bool SetTags(const std::vector<FileID>& filesID, const std::vector<std::string>& tags);
    bool GetFilesSnap(std::vector<Snap>& snaps);
    bool GetFilesInfo(const std::vector<FileID>& filesID, std::vector< FileInfo>& filesInfo);
    bool RemoveFiles(const std::vector<FileID>& files);

    bool FindFiles(const nlohmann::json& query, std::vector< FileInfo>& filesInfo);

  private:
    static void Release(void* data);

  private:
    DBManager* m_pDBManager = nullptr;
    QueryParser m_qParser;
  };
}

#endif
