// 利用rockdb的key_prefix特点，设计key结构，提升检索速度
// key结构定义如下:
// v1.table.id            版本.表名.id
// 版本用于升级迁移过程中保证之前的数据依旧能够正常使用

// v1版本database struct如下:
// v1.image.id, id 使用6位的字母+数字