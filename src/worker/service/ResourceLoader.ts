import url from 'url'
import fs from 'fs'
import { config } from '../../public/CivetConfig'
import { Result } from '../common/Result'
import path from 'path'

export class ResourceLoader {
  constructor() {}

  async download(data: any, dbname: string|undefined = ''): Promise<Result<string, string>>  {
    let downloadDir = 'download'
    if (dbname === '') {
      dbname = config.getCurrentDB()
      if (!dbname) return Result.failure('current resource is undefined')
      const dir = config.getDBPath(dbname);
      downloadDir = dir + '/' + downloadDir;
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir);
      }
    }
    console.info('download to', downloadDir)
    let fullpath: string | null = null;
    try{
      if (data['bin'] !== undefined) {

      } else if (data['url']) {
        // download from network
        fullpath = await this.downloadByHttp(data['url'], downloadDir);
      }
    } catch (err) {
      return Result.failure(err);
      // throw new Error(`download ${data} error`)
    }
    return Result.success(fullpath!);
  }

  private async downloadByHttp(resourceUrl: string, downloadDir: string) {
    const resource = url.parse(resourceUrl)
    console.info('download:', resource.path, ',', downloadDir + resource.pathname)
    const dest = downloadDir + resource.pathname;
    const end = dest.lastIndexOf('/')
    const destname = dest.substr(end, dest.length - end)
    console.info('destname:', path.resolve(downloadDir + destname))
    const dl = require('download')
    fs.writeFileSync(downloadDir + destname, await dl(resourceUrl));
    // dl(resourceUrl).pipe(fs.createWriteStream(downloadDir + destname));
    return path.resolve(downloadDir + destname)
  }
}