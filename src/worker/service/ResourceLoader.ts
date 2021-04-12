import http from 'http'
import url from 'url'
import fs from 'fs'
import { config } from '../../public/CivetConfig'

export class ResourceLoader {
  constructor() {}

  download(data: string, dbname: string = '') {
    let downloadDir = 'download'
    if (dbname === '') {
      dbname = config.getCurrentDB()
      const dir = config.getDBPath(dbname);
      downloadDir = dir + '/' + downloadDir;
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir);
      }
    }
    if (data.indexOf('http')) {
      // download from network
      this.downloadByHttp(data, downloadDir);
    }
  }

  private downloadByHttp(resourceUrl: string, downloadDir: string) {
    let options = {
      host: url.parse(resourceUrl).host,
      port: 80,
      path: url.parse(resourceUrl).pathname
    };
    let filename = url.parse(resourceUrl!).pathname!.split('/').pop();
    let file = fs.createWriteStream(downloadDir + '/' + filename);
    http.get(options, function(res) {
      res.on('data', function(data) {
        file.write(data);
      }).on('end', function() {
        file.end();
        console.log(filename + ' downloaded to ' + downloadDir);
      }).on('error', function(err) {
        console.info(`download ${filename} error: ${err}`)
      });
    });
  }
}