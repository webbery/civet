#pragma once
#include "pegtl/contrib/parse_tree.hpp"
#include "QueryRule.h"

namespace caxios {
struct replace_node : parse_tree::apply<replace_node> {
    template< typename Node, typename... States >
    static void transform(std::unique_ptr< Node >& n, States&&... st) noexcept(noexcept(n->children.size(), n->Node::remove_content(st...)))
    {
      if (n->children.size() > 2) {
        // find real operator
        std::unique_ptr< Node > op = std::move(n->children[1]);;
        for (size_t idx = 2; idx < n->children.size() - 1; ++idx) {
          if (n->children[idx]->has_content()) {
            op = std::move(n->children[idx]);
            break;
          }
        }
        op->children.emplace_back(std::move(n->children[0]));
        op->children.emplace_back(std::move(n->children[n->children.size() - 1]));
        n = std::move(op);
      }
      //else {
      //  n->remove_content(st...);
      //}
    }
  };

  template< typename Rule > struct query_selector : parse_tree::selector <
    Rule,
    parse_tree::store_content::on<
      literal_keyword,
      literal_value_impl,
      literal_op>,
    parse_tree::remove_content::on<
      literal_eq,
      literal_array>,
    parse_tree::fold_one::on<
      literal_query_and>,
    replace_node::on<
      literal_condition>
  >{};

  template<> struct query_selector< literal_keyword > : std::true_type {
    static void transform(std::unique_ptr< parse_tree::node >& n) {
      n->source = "tb:" + n->string();
    }
  };
  template<> struct query_selector< literal_value_impl > : std::true_type {
    static void transform(std::unique_ptr< parse_tree::node >& n) {
      n->source = "vl:" + n->string();
    }
  };
  template<> struct query_selector< literal_op > : std::true_type {
    static void transform(std::unique_ptr< parse_tree::node >& n) {
      n->source = n->string();
    }
  };
}
