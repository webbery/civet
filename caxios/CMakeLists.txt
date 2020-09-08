CMAKE_MINIMUM_REQUIRED(VERSION 3.8)

project(caxios)

include_directories(.
  lmdb
)

file(GLOB_RECURSE SOURCE_LIST ./*.cpp ./lmdb/*.c)

add_library(caxios ${SOURCE_LIST})

set_target_properties(caxios PROPERTIES LINK_FLAGS
  "-s STRICT=1 --bind -s ALLOW_MEMORY_GROWTH=1 -s MALLOC=emmalloc -s FILESYSTEM=1 -s EXPORT_ES6=1 -s MODULARIZE=1 -s USE_ES6_IMPORT_META=0 --no-entry"
)
