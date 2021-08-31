import url from 'url'
import fs from 'fs'
import { config } from '../../public/CivetConfig'
import { Result } from '../common/Result'
import path from 'path'

export class ResourceLoader {
  constructor() {}

  async download(data: any, dbname: string|undefined = ''): Promise<Result<string, any>>  {
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
        // save file to local
        fullpath = downloadDir + '/' + data['name']
        fs.writeFileSync(fullpath, data['bin'])
      } else if (data['url']) {
        // download from network
        fullpath = await this.downloadByHttp(data['url'], downloadDir);
      }
    } catch (err: any) {
      return Result.failure(err);
      // throw new Error(`download ${data} error`)
    }
    return Result.success(fullpath!);
  }

  private async downloadByHttp(resourceUrl: string, downloadDir: string) {
    const resource = url.parse(resourceUrl)
    // console.info('download:', resource)
    let filename = resource.pathname
    if (resource.query) {
      // const xxhash = require('xxhashjs')
      // const hash = xxhash.h32('abcd', 0xABCD).toString()
      const items = resource.query.split('&')
      for (let item of items) {
        const pair = item.split('=')
        if (pair[1].indexOf('.') > 0) {
          filename = pair[1]
          break
        }
      }
    }
    console.info('download file name:', filename)
    const dest = downloadDir + '/' + filename;
    const end = dest.lastIndexOf('/')
    const destname = dest.substr(end, dest.length - end)
    const destpath = downloadDir + '/' + destname
    // console.info('destname:', path.resolve(downloadDir + '/' + destname))
    const dl = require('download')
    fs.writeFileSync(destpath, await dl(resourceUrl));
    // dl(resourceUrl).pipe(fs.createWriteStream(downloadDir + destname));
    return path.resolve(destpath)
  }
}