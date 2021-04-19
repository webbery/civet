#pragma once
#include "StorageProxy.h"
#include "Table.h"
#include "json.hpp"

namespace caxios{

  template<int, int> struct Upgrader;

  template<> struct Upgrader<1, 2> {
    static void upgrade(CStorageProxy* pUpgrade) {
      pUpgrade->Filter(TABLE_FILESNAP, [](uint32_t k, void* pData, uint32_t len, void*& newVal, uint32_t& newLen) -> bool {
        if (k == 0) return false;
        using namespace nlohmann;
        std::string str((char*)pData, (char*)pData + len);
        json js=json::parse(str);
        static std::vector<uint8_t> val;
        val = json::to_cbor(js);
        newVal = val.data();
        newLen = val.size();
        return false; // continue upgrade rest value
      });
    }
  };

  bool upgrade(CStorageProxy* pUpgrade, int from, int to);
}