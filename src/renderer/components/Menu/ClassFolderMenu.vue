<template>
  <div>
    <ul id="menu" class="menu">
      <li class="menu__item">添加</li>
      <li class="menu__item">删除</li>
    </ul>
  </div>
</template>
<script>
export default {
  name: 'class-folder-menu'
}
</script>
<style scoped>
.menu__item {
	display: block;
	line-height: 20px;
	text-align: center;
	margin:10px;
	cursor: default;
}
.menu__item:hover{
	color: #FF0000;
}

.menu {
 	height: auto;
 	width: auto;
 	position: absolute;
 	font-size: 14px;
 	text-align: left;
 	border-radius: 10px;
 	border: 1px solid #c1c1c1;
 	background-color: #ffffff;
}

li:hover {
  background-color: #E0E0E2;
  color: white;
}
</style>