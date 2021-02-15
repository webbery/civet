#pragma once
#include "log.h"
#include "pegtl.hpp"

namespace caxios {
  using namespace TAO_PEGTL_NAMESPACE;

  struct literal_indent : ranges< 'a', 'z', 'A', 'Z', '0', '9' > {};
  struct literal_keyword : plus<literal_indent> {};
  struct literal_indent_cn : utf8::ranges< U'\u2E80', U'\u9FFF'> {};
  struct literal_string_cn : plus < not_one<'\'', '"'> > {};
  struct literal_quote : one<'\'', '"'> {};
  struct literal_spaces : star<space> {};
  //template< char Q >
  //struct str_impl : if_must< one< Q >, until< one< Q >, literal_string > > {};
  struct literal_int_part : plus<digit> {};
  struct literal_float : seq< literal_int_part, one<'.'>, literal_int_part> {};
  struct literal_sign : one<'+', '-'> {};
  struct literal_int : seq<opt<literal_sign>, literal_int_part> {};
  struct literal_datetime_double : seq<one<'^'>, literal_float> {};
  // '2020-09-20T00:00:00.000Z'
  struct literal_datetime_year : rep<4, digit> {};
  struct literal_datetime_month : seq<one<'0', '1'>, digit> {};
  struct literal_datetime_date : seq<one<'0', '1', '2', '3'>, digit> {};
  struct literal_datetime_hour : seq<one<'0', '1', '2'>, digit> {};
  struct literal_datetime_minute : seq<one<'0', '1', '2', '3', '4', '5'>, digit> {};
  struct literal_datetime_second : seq<one<'0', '1', '2', '3', '4', '5'>, digit> {};
  struct literal_datetime_millsecond : seq<digit, digit, digit> {};
  struct literal_date : seq < literal_datetime_year, one<'-'>, literal_datetime_month, one<'-'>, literal_datetime_date> {};
  struct literal_time : seq<literal_datetime_hour, one<':'>, literal_datetime_minute, one<':'>, literal_datetime_second, one<'.'>, literal_datetime_millsecond> {};
  struct literal_datetime_string : seq<literal_date, one<'T'>, literal_time, one<'Z'>> {};

  struct literal_color : seq<one<'#'>, rep<6, xdigit>> {};
  //struct literal_series : plus<literal_indent, '/'> {};
  struct literal_string : sor< literal_string_cn, literal_keyword> {};

  struct literal_value_impl : sor<literal_color, literal_datetime_string, literal_datetime_double, literal_string> {};
  struct literal_string_value : seq<literal_quote, literal_value_impl, literal_quote > {};

  struct literal_gt : string<'$', 'g', 't'> {};
  struct literal_gte : string<'$', 'g', 't', 'e'> {};
  struct literal_lt : string<'$', 'l', 't'> {};
  struct literal_lte : string<'$', 'l', 't', 'e'> {};
  struct literal_ne : string<'$', 'n', 'e'> {};
  struct literal_eq : one<':'> {};
  struct literal_and : one<','> {};
  struct literal_or : string<'$', 'o', 'r'> {};
  struct literal_op : sor< literal_lte, literal_gte, literal_gt, literal_lt, literal_ne> {};

  struct literal_op_key : seq< literal_quote, literal_op, literal_quote> {};
  struct literal_string_key : seq< literal_quote, literal_keyword, literal_quote> {};

  struct literal_basic_value : sor <literal_int, literal_string_value> {};
  struct literal_array : if_must<one<'['>, star<literal_basic_value, opt<literal_and>>, one<']'>> {};
  struct literal_query_compare;
  struct literal_value : sor< literal_basic_value, literal_array, literal_query_compare> {};

  struct literal_start : one<'{', '['> {};
  struct literal_close : one<'}', ']'> {};

  struct literal_condition : seq< literal_string_key, literal_eq, literal_spaces, literal_value > {};
  struct literal_conditions : if_must< literal_and, literal_condition> {};

  struct literal_query_equal : seq<literal_start, literal_condition, literal_spaces, star<literal_conditions>, literal_close > {};
  struct literal_query_compare : seq<literal_start, literal_op_key, literal_eq, literal_value, literal_close> {};

  struct literal_query : sor<literal_query_compare, literal_query_equal > {};

  struct QueryGrammar :
    if_must<
    literal_query,
    eof
    > {};
}