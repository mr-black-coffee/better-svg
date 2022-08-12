# BETTER-SVG

better-svg是面向web环境进行svg文件的动态生成与内容监控的工具。

## 安装

```bash
# npm
npm install better-svg

# yarn
yarn add better-svg

```

## 使用

```
// 
<template>

</template>
<script>
import { createSvg } from 'better-svg'
export default {
	data() {...},
	methods: {
		async init(){
			let content = await loadSvg(this.svgSrc)
		}
	}
}
</script>
```
