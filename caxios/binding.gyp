{
  "targets": [
    {
      "target_name": "civetkern",
      "sources": [
        "src/lmdb/mdb.c",
        "src/lmdb/midl.c",
        "src/util/util.cpp",
        "src/interface.cpp",
        "src/database.cpp",
        "src/log.cpp",
        "src/civetkern.cpp" ],
      "include_dirs": [
        "include",
        "src",
        "<!(node -e \"require('nan')\")"
      ],
      'cflags_c': [],
      'cflags_cc': [
        '-std=c++17'
      ],
      "cflags!": [
        '-fno-exceptions'
      ],
      "cflags_cc!": [
        '-fno-exceptions'
      ],
      'xcode_settings': {
        'CLANG_CXX_LANGUAGE_STANDARD': 'c++17',
        'MACOSX_DEPLOYMENT_TARGET': '10.9',
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'GCC_ENABLE_CPP_RTTI': 'YES',
        'OTHER_CPLUSPLUSFLAGS': [
          '-fexceptions',
          '-Wall',
          '-O3'
        ]
      },
	  'msvs_settings': {
        'VCCLCompilerTool': {
		  "ExceptionHandling": 1,
		  'AdditionalOptions': [ '-std:c++17' ]
		}
      }
    }
  ]
}