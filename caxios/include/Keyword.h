#pragma once
#include <string_view>

#define TABLE_PREFIX     "tb:"
#define VALUE_PREFIX     "vl:"

#define TB_Keyword    "keyword"
#define TB_Tag        "tag"
#define TB_Class      "class"
#define TB_Annotation "annotation"
#define TB_FileID     "fileid"

#define OP_GreateThanEqual    "$gte"
#define OP_GreateThan         "$gt"
#define OP_LessThan           "$lt"
#define OP_LessThanEqual      "$lte"
#define OP_And                "$and"
#define OP_Or                 "$or"
#define OP_Equal              "$eq"
#define OP_In                 "$in"
#define OP_Near               "$near"
//#define OP_Greate     "$ne"
//#define OP_Greate     "$in"
//#define OP_Greate     "$nin"
//#define OP_Greate     "$all"
//#define OP_Greate     "$not"

inline bool is_table(const std::string_view view) {
  return view.compare(0, strlen(TABLE_PREFIX), TABLE_PREFIX) == 0
    || view == TB_Keyword || view == TB_Tag || view == TB_Class
    || view == TB_FileID || view == TB_Annotation;
}

inline bool is_value(const std::string_view view) {
  return view.compare(0, strlen(VALUE_PREFIX), VALUE_PREFIX) == 0;
}

inline bool is_operator(const std::string_view view) {
  return view == OP_And || view == OP_GreateThanEqual || view == OP_GreateThan
    || view == OP_LessThan || view == OP_LessThanEqual || view == OP_Or || view == OP_Near;
}

inline bool is_and(const std::string_view view) {
  if (view.find("_and") != std::string::npos) {
    return true;
  }
  return false;
}

inline bool is_in(const std::string_view view) {
  if (view.find("_array") != std::string::npos) {
    return true;
  }
  return false;
}