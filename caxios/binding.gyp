{
  "targets": [
    {
      "target_name": "civetkern",
      "sources": [
        "src/lmdb/mdb.c",
        "src/lmdb/midl.c",
        "src/util/util.cpp",
        "src/util/pinyin.cpp",
        "src/interface.cpp",
        "src/database.cpp",
        "src/db_manager.cpp",
        "src/log.cpp",
        "src/DBThread.cpp",
        "src/table/TableTag.cpp",
        "src/table/TableMeta.cpp",
        "src/table/TableClass.cpp",
        "src/RPN.cpp",
        "src/Condition.cpp",
        "src/Table.cpp",
        "src/Expression.cpp",
        "src/StorageProxy.cpp",
        "src/upgrader.cpp",
        "src/civetkern.cpp" ],
      "include_dirs": [
        "include",
        "src",
        # "<!(node -e \"require('nan')\")",
		    '<!@(node -p "require(\'node-addon-api\').include")',
      ],
      'cflags_c': [],
      'cflags_cc': [
        '-std=c++17',
        '-frtti',
        '-Wno-pessimizing-move'
      ],
      "cflags!": [
        '-fno-exceptions'
      ],
      "cflags_cc!": [
        '-fno-exceptions',
        '-std=gnu++1y',
        '-std=gnu++0x'
      ],
      'xcode_settings': {
        'CLANG_CXX_LANGUAGE_STANDARD': 'c++17',
        'MACOSX_DEPLOYMENT_TARGET': '10.9',
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'GCC_ENABLE_CPP_RTTI': 'YES',
        'OTHER_CPLUSPLUSFLAGS': [
          '-fexceptions',
          '-Wall',
          '-mmacosx-version-min=10.15',
          '-O3'
        ]
      },
      'conditions':[
        ['OS=="win"', {
          'configurations':{
            'Release': {
	            'msvs_settings': {
                'VCCLCompilerTool': {
                  "ExceptionHandling": 1,
                  'AdditionalOptions': [ '-std:c++17' ],
                  'RuntimeTypeInfo': 'true'
                }
              }
            },
            'Debug': {
	            'msvs_settings': {
                'VCCLCompilerTool': {
                  "ExceptionHandling": 1,
                  'AdditionalOptions': [ '-std:c++17' ],
                  'RuntimeTypeInfo': 'true'
                }
              }
            }
          }
        }],
        ['OS=="linux"', {
        }]
      ]
    }
  ]
}