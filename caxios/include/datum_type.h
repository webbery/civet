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
  typedef std::map<char, std::vector<std::tuple<std::string, std::string, std::vector<FileID> > > > TagTable;
  typedef std::vector<std::string> Classes;
  typedef std::vector<std::string> Annotations;
  typedef std::vector<std::string> Keywords;
  typedef std::tuple<FileID, std::string, char> Snap; // fileid, display_name, initialize_state
  typedef std::tuple<FileID, MetaItems, Tags, Classes, Annotations, Keywords> FileInfo;
}