<div align="center">
<img src="https://raw.fastgit.org/webbery/civet/master/src/main/asset/icon/icon.png" alt=""/>
<h1>Civet</h1>
<blockquote>资源管理新体验</blockquote>
<a href="https://github.com/webbery/civet/actions">
<img src="https://github.com/webbery/civet/workflows/win-build/badge.svg" alt="">
</a>
<a href="https://github.com/webbery/civet/actions">
<img src="https://github.com/webbery/civet/workflows/mac-build/badge.svg" alt="">
</a>
<a href="https://github.com/webbery/civet/actions">
<img src="https://github.com/webbery/civet/workflows/linux-build/badge.svg" alt="">
</a>
<a href="https://gitter.im/webbery/civet?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge">
<img src="https://badges.gitter.im/webbery/civet.svg" alt="">
</a>
</div>

简体中文 | [English](./README-en.md)  
# 应用概述  
> :kissing_heart: 支持多平台(Windows/Mac/Ubuntu)的图片素材管理软件。  
目标是希望像VSCode那样，以扩展的形式为用户提供一个数字资产(图片、文档、视频、文献、网页等)的管理软件。

![界面预览](https://raw.githubusercontent.com/webbery/civet/master/show.JPG)

### 下载

[v0.1.2-for_test](https://github.com/webbery/civet/releases)  

### 相关资源

[插件开发](https://webberg.gitee.io/civet/extension.html)  
[插件市场](https://webberg.gitee.io/civet/market.html)  

**道阻且长，行则将至。**

#### 问题反馈

如有任何使用上的问题或建议请反馈到[**Issue**](https://github.com/webbery/civet/issues)  
或者反馈到[**Trello**](https://trello.com/b/M4hmAF2h/civet)

### 类似软件对比
|  软件   | 界面 | 开发语言  | 本地存储  | 协议 | 平台
| :----: | :----: | :----:  |  :----: | :----: | :----: |
| Civet  | Electron | Typescript/C++ | [lmdb](https://zhuanlan.zhihu.com/p/70359311) | 开源MIT | Windows/Mac/Ubuntu
| Eagle  | Electron | Js | Json/图片拷贝 | 私有 | Windows/Mac
| Billfish  | Qt | C++ | Sqlite + 图片拷贝/索引 | 私有 | Windows/Mac
| PicSee  | ObjectC | ObjectC | Realm | 私有 | Mac

#### RoadMap
+ [ ] 增加数据源插件功能，以支持多种格式(本地及网页等)的数据读取和展示
+ [ ] 增加存储插件功能，以支持多种数据存储方式(如本地复制、云存储等)
+ [ ] 增加信息提取插件功能，以增强不同文件类型的信息存储与检索
+ [ ] 引入HTML5批注规范，为各种类型的文件增加批注功能

#### Requirements
C++编译器要求支持C++17, Node版本建议>12  

#### 感谢  
lmdb提供了一个基于共享内存的数据库，使civet在存储大量的缩略图上有巨大的性能改善  
lipvips为civet提供了支持多种格式图像的读取及操作功能  
PEGTL为civet的数据检索功能提供了灵活的查询语法，使查询各类数字资产信息成为可能  
感谢阿里的qiankun提供了优秀的微前端  

---

开发者名单：webberg
