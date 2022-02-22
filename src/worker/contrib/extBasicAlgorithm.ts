import { BaseExtension } from '../ExtensionPackage'

export class ExtBasicAlgorithm extends BaseExtension {
  constructor() {
    super()
    super.name = '__cv_basic'
    super.instance = this.initialize()
  }

  private initialize() {
    return {
      // read: (uri: ResourcePath) => {
      //   const f = path.parse(uri.local())
      //   const extname = f.ext.substr(1).toLowerCase()
      //   const extensions = this._activableExtensions.get(extname)
      //   if (!extensions || extensions.length === 0) {
      //     const msg = `No extensions can read ${extname} file`
      //     showErrorInfo({msg: msg})
      //     return Result.failure(msg)
      //   }
      //   let resource: Resource = APIFactory.createResource(this._pipeline);
      //   resource.filename = f.base
      //   resource.path = uri.local()
      //   if (uri.remote()) {
      //     resource.remote = uri.remote()
      //   }
      //   resource.filetype = extname
      //   resource.putProperty({ name: 'type', value: extname, type: PropertyType.String, query: true, store: true })
      //   resource.putProperty({ name: 'filename', value: f.base, type: PropertyType.String, query: true, store: true })
      //   resource.putProperty({ name: 'path', value: uri.local(), type: PropertyType.String, query: false, store: true })
      // }
    }
  }
}