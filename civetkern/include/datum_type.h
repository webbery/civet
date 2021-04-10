#pragma once
#include <map>
#include <vector>

#define CVDB_VERSION  1
namespace caxios {
  enum DBFlag {
    ReadWrite,
    ReadOnly
  };

  typedef unsigned int FileID;
  //struct 
  typedef uint32_t WordIndex;
  typedef uint32_t ClassID;
  typedef std::map<std::string, std::string > MetaItem;
  typedef std::vector<MetaItem> MetaItems;
  typedef std::vector<std::string> Tags;
  typedef std::map<char, std::vector<std::tuple<std::string, std::string, std::vector<FileID> > > > TagTable;
  typedef std::vector<std::string> Annotations;
  typedef std::vector<std::string> Keywords;
  typedef std::tuple<FileID, std::string, char> Snap; // fileid, display_name, initialize_state
  typedef std::vector<std::string> Classes;
  typedef std::tuple<FileID, MetaItems, Tags, Classes, Annotations, Keywords> FileInfo;

  struct WordRef{
    WordIndex _wid;
    uint8_t _ref;
  };

  template<typename T> struct word_policy;
  template<> struct word_policy< WordIndex > {
    static WordIndex id(const WordIndex& ref) { return ref; }
  };
  template<> struct word_policy< WordRef > {
    static WordIndex id(const WordRef& ref) { return ref._wid; }
  };
  inline bool operator == (const WordRef& left, const WordRef& right) {
    return left._wid == right._wid;
  }
  inline bool operator != (const WordRef& left, const WordRef& right) {
    return left._wid != right._wid;
  }

  inline bool operator < (const WordRef& left, const WordRef& right) {
    return left._wid < right._wid;
  }
}