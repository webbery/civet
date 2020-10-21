#pragma once
#include <map>
#include <vector>
#include "Value.h"

namespace caxios {
  typedef unsigned int FileID;
  typedef uint32_t WordIndex;
  typedef std::map<std::string, std::string > MetaItem;
  typedef std::vector<MetaItem> MetaItems;
  typedef std::vector<std::string> Tags;
  typedef std::vector<std::string> Annotations;
  typedef std::vector<std::string> Keywords;
  typedef std::tuple<FileID, std::string, char> Snap; // fileid, display_name, initialize_state
  typedef std::tuple<FileID, MetaItems, Tags, Annotations, Keywords> FileInfo;
}