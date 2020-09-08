CMAKE_MINIMUM_REQUIRED(VERSION 3.8)

project(caxios)

add_subdirectory(lmdb)

inlcude_directories(.
  lmdb
)

file(GLOB_RECURSE SOURCE_LIST ./*.cpp ./lmdb/*.c)

add_library(caxios ${SOURCE_LIST})
