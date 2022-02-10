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
<a href="https://github.com/webbery/civet/releases/latest">
<img src="https://img.shields.io/github/v/tag/webbery/civet.svg?style=flat-square" alt="">
</a>
<a href="https://gitter.im/webbery/civet?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge">
<img src="https://badges.gitter.im/webbery/civet.svg" alt="">
</a>
</div>

简体中文 | [English](./README-en.md)  
# 应用概述  
> :kissing_heart: 支持多平台(Windows/Mac/Ubuntu)的图片素材管理软件。  
目标是希望像VSCode那样，以扩展的形式为用户提供一个数字资产(图片、文档、视频、文献、网页等)的管理软件。

![界面预览](https://raw.fastgit.org/webbery/civet/master/show.gif)

### Install

开发版本下载链接: [Development Version](https://github.com/webbery/civet/releases)  
当前windows环境下因为没有签名的原因，所以需要在安装文件的右键“属性”->“常规”中关闭掉安全选项  
由于版本更新比较慢，所以也可以自行编译。  
编译安装方式：
  - 确保自己平台的node版本是node 14及以上，C++编译器支持C++17。如果使用的是Ubuntu16，可以使用`update-alternatives`命令安装并切换高版本的gcc
  - 在下载的源代码目录下，运行`npm install`安装相关的依赖包
  - 依赖包安装完毕后，可以尝试运行`npm run dev`查看开发环境下是否能正常运行
  - 如果能够正常运行，可以执行`npm run build`打包安装包
  - 如果是在Mac环境下，请确保自己的环境能够进行签名打包

### 相关资源

[插件开发](https://webberg.gitee.io/civet/extension.html)  
<!-- [插件市场](https://webberg.gitee.io/civet/market.html)   -->

**道阻且长，行则将至。**

### 类似软件对比
|  软件   | 界面 | 开发语言  | 本地存储  | 协议 | 平台
| :----: | :----: | :----:  |  :----: | :----: | :----: |
| Civet  | Electron | Typescript/C++ | [lmdb](https://zhuanlan.zhihu.com/p/70359311) | 开源MIT | Windows/Mac/Ubuntu
| Eagle  | Electron | Js | Json/图片拷贝 | 私有 | Windows/Mac
| Billfish  | Qt | C++ | Sqlite + 图片拷贝/索引 | 私有 | Windows/Mac
| PicSee  | ObjectC | ObjectC | Realm | 私有 | Mac

#### RoadMap
:white_square_button: 自定义界面扩展，增加数据源插件功能，以支持多种格式(本地及网页等)的数据读取和展示
+ [ ] 增加存储插件功能，以支持多种数据存储方式(如本地复制、云存储等)
+ [ ] 增加信息提取插件功能，以增强不同文件类型的信息存储与检索
+ [ ] 引入HTML5批注规范，为各种类型的文件增加批注功能
+ [ ] 升级数据库，增强搜索功能

#### 技术细节
开发过程踩过许多坑，在填坑的同时记录下这些过程，以便其他开发者在做类似功能的时候能避免踩坑：  
[如何实现vscode的require劫持](https://zhuanlan.zhihu.com/p/382381432)  
[civet的图像主色彩抽取算法](https://zhuanlan.zhihu.com/p/355278737)  
[Node如何调用C++代码](https://zhuanlan.zhihu.com/p/395634920)  

---

开发者名单：webberg
