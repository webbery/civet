# civet


![](https://github.com/webbery/civet/workflows/win-build/badge.svg)
![](https://github.com/webbery/civet/workflows/mac-build/badge.svg)
![](https://github.com/webbery/civet/workflows/linux-build/badge.svg)
> :kissing_heart: 支持多平台(Windows/Mac/Ubuntu)的图片素材管理软件。  
目标是希望像VSCode那样，以扩展的形式为用户提供一个数字资产(图片、文档、视频、文献、网页等)的管理软件。

![界面预览](https://raw.githubusercontent.com/webbery/civet/master/show.JPG)

### 下载


开发进度  
![78%](https://progress-bar.dev/75/?title=检索模块)
![80%](https://progress-bar.dev/80/?title=界面逻辑)
![90%](https://progress-bar.dev/90/?title=存储模块)

项目讨论区(https://www.yuque.com/g/webberg/dacstu/docs)  

**道阻且长，行则将至。**

### 类似软件对比
|  软件   | 开发平台  | 本地存储  | 协议 |
| :----: | :----:   |  :----: | :----: |
| Civet  | Electron/C++ | lmdb | 开源MIT
| Eagle  | Electron | Json/图片拷贝 | 私有
| Billfish  | Qt | Sqlite + 图片拷贝/索引 | 私有

#### 问题反馈

如有任何使用上的问题或建议请反馈到 https://github.com/webbery/civet/issues

#### RoadMap
+ [ ] 增加数据源插件功能，以支持多种格式(本地及网页等)的数据读取和展示
+ [ ] 增加存储插件功能，以支持多种数据存储方式(如本地复制、云存储等)
+ [ ] 增加信息提取插件功能，以增强不同文件类型的信息存储与检索
+ [ ] 引入HTML5批注规范，为各种类型的文件增加批注功能

#### 感谢  
lmdb提供了一个基于共享内存的数据库，使civet在存储大量的缩略图上有巨大的性能改善  
lipvips为civet提供了支持多种格式图像的读取及操作功能  
PEGTL为civet的数据检索功能提供了灵活的查询语法，使查询各类数字资产信息成为可能  
感谢阿里的qiankun提供了优秀的微前端  

---

开发者名单：webberg
