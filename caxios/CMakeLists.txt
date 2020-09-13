cmake_minimum_required (VERSION 3.8)

project(caxios)

include_directories(
	include
	${CMAKE_SOURCE_DIR}/node_modules/nan
	${CMAKE_SOURCE_DIR}/thirdparty/node-v10.16.2/include/node
)

file(GLOB_RECURSE SRC_FILES src/*.cpp src/lmdb/*.c)

add_library(${PROJECT_NAME} SHARED ${SRC_FILES})

add_custom_command(TARGET ${PROJECT_NAME}
    POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:caxios> ${CMAKE_SOURCE_DIR}/test/${PROJECT_NAME}.node
    COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:caxios> ${CMAKE_SOURCE_DIR}/../src/generated/${PROJECT_NAME}.node
)