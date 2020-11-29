#pragma once
#include "log.h"
#include "pegtl.hpp"

namespace caxios {
  using namespace TAO_PEGTL_NAMESPACE;

  struct literal_indent : ranges< 'a', 'z', 'A', 'Z', '0', '9' > {};
  struct literal_string : plus<literal_indent> {};
  struct literal_string_value : seq<one<'\'', '\"'>, literal_string, one<'\'', '\"'> > {};
  struct literal_number : ranges<'0', '9'> {};
  struct literal_sign : one<'+', '-'> {};
  struct literal_int : seq<opt<literal_sign>, plus<literal_number>> {};
  struct literal_gt : string<'$', 'g', 't'> {};
  struct literal_lt : string<'$', 'l', 't'> {};
  struct literal_eq : one<':'> {};
  struct literal_op : sor< literal_gt, literal_lt> {};
  struct literal_key : sor< literal_op, literal_string> {};
  struct literal_value : sor< literal_int, literal_string_value, literal_value> {};
  struct literal_start : one<'{', '['> {};
  struct literal_close : one<'}', ']'> {};
  struct literal_query : seq<literal_start, literal_key, literal_eq, literal_value, literal_close > {};

  struct QueryGrammar :
    if_must<
    literal_query,
    eof
    > {};
}