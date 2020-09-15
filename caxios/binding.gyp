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
      "cflags!": [],
      "cflags_cc!": []
    }
  ]
}