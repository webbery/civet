#pragma once
#include <map>
#include <vector>

namespace caxios {
  typedef unsigned int FileID;
  typedef std::map<std::string, std::string> MetaItem;
  typedef std::vector<MetaItem> MetaItems;
  typedef std::vector<std::string> Tags;
  typedef std::vector<std::string> Annotations;
  typedef std::vector<std::string> Keywords;
  typedef std::tuple<FileID, std::string, char> Snap; // fileid, display_name, initialize_state
}