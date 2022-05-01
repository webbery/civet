export enum IPCExtensionMessage {
  Property = 'Property',
  Navigation = 'Navigation',
  Overview = 'Overview',
  DetailView = 'DetailView',
  Search = 'Search'
}

export enum IPCNormalMessage {
  // system
  // ON_ERROR_MESSAGE = 'onErrorMessage',
  RENDERER_MOUNTED = 'mounted',
  // resource
  RENDERER_GET_RESOURCE_INFO = 'getImageInfo',
  RENDERER_GET_RESOURCES_INFO = 'getImagesInfo',
  GET_RESOURCES_INDEXES = 'getImagesIndex',
  GET_RESOURCES_DIRECTORY = 'getImagesWithDirectoryFormat',
  GET_RESOURCES_SNAP = 'getFilesSnap',
  GET_UNCATEGORY_RESOURCES = 'getUncategoryImages',
  GET_UNTAG_RESOURCES = 'getUntagImages',
  ADD_RESOURCES_BY_DIRECORY = 'addImagesByDirectory',
  ADD_RESOURCES_BY_PATHS = 'addImagesByPaths',
  QUERY_RESOURCES = 'queryFiles',
  ON_RESOURCE_UPDATE = 'updateImageList',
  UPDATE_RESOURCE_CLASS = 'updateImageCategory',
  UPDATE_RESOURCE_NAME = 'updateFileName',
  REMOVE_RESOURCES = 'removeFiles',
  // tag
  GET_ALL_TAGS_WITH_RESOURCES = 'getAllTagsWithImages',
  GET_ALL_TAGS = 'getAllTags',
  SET_TAG = 'setTag',
  REMOVE_TAG = 'removeTag',
  // classes
  GET_CLASSES_DETAIL = 'getCategoryDetail',
  GET_ALL_CLASSES = 'getAllCategory',
  ADD_CLASSES = 'addCategory',
  UPDATE_CLASS_NAME = 'updateCategoryName',
  REMOVE_CLASSES = 'removeClasses',
  // database
  REINIT_DB = 'reInitDB',
  REMOVE_DB = 'removeDB',
  // extension
  INSTALL_EXTENSION = 'install',
  UNINSTALL_EXTENSION = 'uninstall',
  UPDATE_EXTENSION = 'update',
  LIST_EXTENSION = 'getExtensions',
  // workbench
  GET_SELECT_CONTENT_ITEM_INFO = 'getSelectContentItemInfo',
  REQUEST_UPDATE_RESOURCES = 'onResourcesLoading',
  RETRIEVE_OVERVIEW = 'rtvOverview',
  GET_OVERVIEW_MENUS = 'getOverviewMenus',
  // content view
  RETRIEVE_CONTENT_VIEW = 'rtvContentView',
  // commands
  POST_COMMAND = 'pstCmd',
  GET_ACTIVATE_COMMANDS = 'getActiveCmd'
}

export enum IPCRendererResponse {
  hasDirectory = 'isDirectoryExist',
  getImagesWithDirectoryFormat = 'replyImagesWithDirectory',
  getImagesInfo = 'replyImagesInfo',
  getImageInfo = 'replyImageInfo',
  getAllTags = 'replyAllTags',
  getAllTagsWithImages = 'replyAllTagsWithImages',
  queryFiles = 'replyQueryFilesResult',
  getAllCategory = 'replyAllCategory',
  getCategoryDetail = 'replyClassesInfo',
  getUncategoryImages = 'replyUncategoryImages',
  getUntagImages = 'replyUntagImages',
  reInitDB = 'replyReloadDBStatus',
  getFilesSnap = 'replyFilesSnap',
  getOverviewMenus = 'replyOverviewMenus',
  install = 'replyInstallResult',
  uninstall = 'replyUninstallResult',
  getActiveCmd = 'replyActiveCommands',
  getExtensions = 'replyAllExtensions',
  ON_ERROR_MESSAGE = 'onEM',
  ON_VIEW_ROUTER_ADD = 'onVRI',
  ON_VIEW_ROUTER_CLEAR = 'onVRC',
  ON_EXTENSION_ROUTER_UPDATE = 'Overview',
  ON_EXTENSION_CONTENT_UPDATE = 'ContentView',
  ON_RESOURCE_UPDATED = 'onRU',
  ON_SEARCH_INIT_COMMAND = 'onSIC'
}