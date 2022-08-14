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
      console.debug('download from dbname:', dbname)
      if (!dbname) {
        const error = 'current resource is undefined'
        console.error(error)
        return Result.failure(error)
      }
      const dir = config.getDBPath(dbname);
      if (!dir) {
        const error = `resource lib ${dbname}'s path is empty: ${dir}`
        console.error(error)
        return Result.failure(error)
      }
      downloadDir = dir + '/' + downloadDir;
      console.debug('download from dir:', downloadDir)
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir);
      }
    }
    console.info('download to', downloadDir, data)
    let fullpath: string | null = null;
    try{
      if (data['bin'] !== undefined) {
        // save file to local
        fullpath = downloadDir + '/' + data['name']
        fs.writeFileSync(fullpath, Buffer.from(data['bin']))
      } else if (data['url']) {
        // download from network
        fullpath = await this.downloadByHttp(data['url'], downloadDir);
      }
    } catch (err: any) {
      console.error('download error:', err)
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