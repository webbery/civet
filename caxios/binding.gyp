{
  "targets": [
    {
      "target_name": "civetkern",
      "sources": [
        "src/lmdb/mdb.c",
        "src/lmdb/midl.c",
        "src/util/util.cpp",
        "src/interface.cpp",
        "src/civetkern.cpp" ],
      "include_dirs": [
        "include",
        "<!(node -e \"require('nan')\")"
      ],
      'cflags_cc': [
        '-std=c++17'
      ],
      "cflags!": [
        '-fno-exceptions'
      ],
      "cflags_cc!": [
        '-fno-exceptions'
      ]
    }
  ]
}