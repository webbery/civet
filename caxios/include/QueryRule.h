#pragma once
#include "log.h"
#include "pegtl.hpp"

namespace caxios {
  using namespace TAO_PEGTL_NAMESPACE;

  struct literal_indent : ranges< 'a', 'z', 'A', 'Z', '0', '9' > {};
  struct literal_keyword : plus<literal_indent> {};
  struct literal_indent_cn : utf8::ranges< U'\u2E80', U'\u9FFF'> {};
  struct literal_string_cn : plus < literal_indent_cn > {};
  struct literal_quote : one<'\'', '"'> {};
  //template< char Q >
  //struct str_impl : if_must< one< Q >, until< one< Q >, literal_string > > {};
  //struct literal_quote : sor< str_impl< '\'' >, str_impl< '"' > > {};
  struct literal_value_impl : sor<literal_string_cn, literal_keyword> {};
  struct literal_string_value : seq<literal_quote, literal_value_impl, literal_quote > {};
  struct literal_single_number : ranges<'0', '9'> {};
  struct literal_int_part : seq<literal_single_number> {};
  struct literal_sign : one<'+', '-'> {};
  struct literal_int : seq<opt<literal_sign>, plus<literal_int_part>> {};
  struct literal_year : seq<one<'0', '1', '2'>, literal_single_number, literal_single_number, literal_single_number> {};

  struct literal_gt : string<'$', 'g', 't'> {};
  struct literal_gte : string<'$', 'g', 't', 'e'> {};
  struct literal_lt : string<'$', 'l', 't'> {};
  struct literal_lte : string<'$', 'l', 't', 'e'> {};
  struct literal_ne : string<'$', 'n', 'e'> {};
  struct literal_eq : one<':'> {};
  struct literal_and : one<','> {};
  struct literal_or : string<'$', 'o', 'r'> {};
  struct literal_op : sor< literal_lte, literal_gte, literal_gt, literal_lt, literal_ne> {};

  struct literal_key : sor<literal_op, literal_keyword> {};

  struct literal_string_key : seq<literal_quote, literal_key, literal_quote > {};
  struct literal_basic_value : sor < literal_int, literal_string_value> {};
  struct literal_array : seq<one<'['>, star<literal_basic_value, opt<literal_and>>, one<']'>> {};
  struct literal_value : sor< literal_basic_value, literal_array, literal_value> {};

  struct literal_start : one<'{', '['> {};
  struct literal_close : one<'}', ']'> {};
  struct literal_query : seq<literal_start, literal_string_key, literal_eq, literal_value, literal_close > {};

  struct QueryGrammar :
    if_must<
    literal_query,
    eof
    > {};
}