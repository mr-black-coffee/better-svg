export function createSvg(content){
    if (!content) return
    // 类型1
    let text = content.replace(/\s/g, ' ')
    let reg = /^(.*)(<svg[^<]*)(<.*)(<\/svg>)/i
    let arr = reg.exec(text)
    let tag
    let html
    let svg
    if (!arr) {
        // 类型2
        reg = /^(<svg[^<]*)(<.*)(<\/svg>)/i
        arr = reg.exec(text)
        if (arr) {
            tag = arr?.[1]
            html = arr?.[2] || ''
        } else {
            console.log(this?.src + '解析失败')
            return
        }
    } else {
        tag = arr?.[2]
        html = arr?.[3] || ''
    }
    if (tag) {
        const attrs = tag.replace(/\\"/g, '"')
            .replace(/<svg /i, '')
            .replace(/>/, '')
            .replace(/(\s*)$/, '')
            .split(/"\s/);
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        attrs.forEach(attr => {
            const kv = attr.replace(/\\"/g, '')
                .replace(/"/g, '')
                .split('=')
            svg.setAttribute(kv[0].replace(/\s/g, ''), kv[1])
        })
        svg.innerHTML = html.replace(/\\t/g, '')
    }
    return svg
}