/**
 * 监控SVG中的text类型节点并自动进行水平对齐
 */

'use strict'

const TRANSFORM_TYPES = {
    TRANSLATE: 'translate',
    MATRIX: 'matrix',
}

// 默认左对齐
const ALIGN_TYPES = {
    CENTER: 'center',
    RIGHT: 'right'
}
const reg = /translate\(\s*(\d+\.?\d*)\s+(\d+\.?\d*)\s*\)/i
const reg2 = /matrix\(\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)\s*\)/i
const idProp = '_monitor_id'
const defaultCenterTextClass = 'TextM'

// 每个实例为某种selector对应的文本节点类型
export class SvgTextMonitor {
    _id = ''
    _align = ''
    _config = ''

    static centerTextClass = defaultCenterTextClass
    static observes = []
    static instances = []

    constructor(options) {
        const {
            container,
            selector = '',
            align = ALIGN_TYPES.CENTER,
            config = {
                attributes: true,
                characterData: true,
                childList: true,
                subtree: true,
            }
        } = options
        let doms
        if (container && container.innerHTML) {
            if (selector && typeof selector === 'string') {
                doms = container.querySelectorAll(selector)
            } else {
                doms = [container]
            }
            this._id = SvgTextMonitor.createId()
            this._align = align
            this._config = config
            if (doms.length) {
                doms.forEach(textDom => {
                    const _id = SvgTextMonitor.createId()
                    const observer = new MutationObserver(SvgTextMonitor.onChange)
                    // 标记
                    textDom.setAttribute(idProp, _id)
                    const node = {
                        _id,
                        dom: textDom, // 文本节点
                        align, // 对齐方式，默认居中
                        oldTransX: 0, // 原translateX值
                        oldTransY: 0, // 原translateY值
                        oldWidth: 0, // 原宽度
                    }
                    // 初始状态
                    SvgTextMonitor.recordInfo(node)
                    observer.ownerId = this._id
                    observer._node = node
                    observer._id = _id
                    observer.observe(textDom, config)
                    SvgTextMonitor.observes.push(observer)

                })
            }
            SvgTextMonitor.instances.push(this)
        }
    }

    start() {
        SvgTextMonitor.observes.forEach(observe => {
            if (observe.ownerId === this._id && observe.stopped) {
                SvgTextMonitor.recordInfo(observer._node)
                observe.observe(observe._node.dom, this._config)
                observe.stopped = false
            }
        })
    }

    stop() {
        SvgTextMonitor.observes.forEach(observe => {
            if (observe.ownerId === this._id) {
                observe.disconnect()
                observe.stopped = true
            }
        })
    }

    destroy() {
        for (let idx = SvgTextMonitor.observes.length - 1; idx >= 0; idx--) {
            if (SvgTextMonitor.observes[idx].ownerId === this._id) {
                SvgTextMonitor.clearDom(SvgTextMonitor.observes[idx].node.dom)
                SvgTextMonitor.observes[idx].node.dom = null
                SvgTextMonitor.observes[idx].disconnect
                SvgTextMonitor.observes[idx] = null
                SvgTextMonitor.observes.splice(idx, 1)
            }
        }
        idx = SvgTextMonitor.instances.findIndex(i => i._id === this._id)
        SvgTextMonitor.instances[idx] = null
        idx > -1 && SvgTextMonitor.instances.splice(idx, 1)
    }

    static createId() {
        return `${Date.now()}${Math.random() * 100000}`
    }

    static recordInfo(node) {
        if (node) {
            let transValue = SvgTextMonitor.getTransformValue(node.dom)
            if (transValue) {
                node.oldTransX = transValue.oldTransX
                node.oldTransY = transValue.oldTransY
                node.oldWidth = node.dom.textLength?.baseVal?.value || 0
            }
        }
    }

    static getTransformValue(textDom) {
        let oldTransform = textDom.getAttribute('transform')
        let transformType = textDom.getAttribute('transformType')
        if (oldTransform) {
            if (!transformType || transformType === TRANSFORM_TYPES.TRANSLATE) {
                let result = reg.exec(oldTransform)
                // translate
                if (result?.[1] !== undefined && result?.[2] !== undefined) {
                    !transformType && textDom.setAttribute('transformType', TRANSFORM_TYPES.TRANSLATE);
                    let oldTransX = +result[1]
                    let oldTransY = +result[2]
                    return {
                        oldTransX,
                        oldTransY
                    }
                }
            }
            if (!transformType || transformType === TRANSFORM_TYPES.MATRIX) {
                // matrix
                let result = reg2.exec(oldTransform)
                if (result?.[5] !== undefined && result?.[6] !== undefined) {
                    !transformType && textDom.setAttribute('transformType', TRANSFORM_TYPES.MATRIX);
                    let oldTransX = +result[5]
                    let oldTransY = +result[6]
                    return {
                        oldTransX,
                        oldTransY
                    }
                }
            }
        }
        return null
    }

    static onChange(mutationsList, observer) {
        const textDom = observer._node.dom
        const transValue = SvgTextMonitor.getTransformValue(textDom)
        const oldTransX = observer._node.oldTransX
        const oldTransY = observer._node.oldTransY
        const width = textDom.textLength?.baseVal?.value
        const oldWidth = +observer._node.oldWidth
        if (transValue && oldTransX && oldTransY && oldWidth && oldWidth !== width) {
            const diff = width - oldWidth
            if (!isNaN(diff)) {
                const newTransX = observer._node.align === ALIGN_TYPES.CENTER
                        ? +oldTransX - diff / 2
                        : observer._node.align === ALIGN_TYPES.RIGHT
                            ? +oldTransX - diff
                            : oldTransX
                if (textDom.getAttribute('transformType') === TRANSFORM_TYPES.TRANSLATE) {
                    textDom.setAttribute('transform', `translate(${newTransX} ${oldTransY})`)
                } else {
                    textDom.setAttribute('transform', textDom.getAttribute('transform').replace(reg2, (match, p1, p2, p3, p4, p5, p6) => {
                        return `matrix(${p1}, ${p2}, ${p3}, ${p4}, ${newTransX}, ${p6})`
                    }))
                }
                observer._node.oldTransX = newTransX
                observer._node.oldWidth = width
            }
        }
    }

    static startAll(selector = `.${defaultCenterTextClass}`, root = document) {
        const textDoms = root.querySelectorAll(selector)
        textDoms.forEach(textDom => {
            if (!textDom.getAttribute(idProp)) {
                new SvgTextMonitor({
                    container: textDom
                })
            }
        })
    }

    static clearDom(textDom) {
        textDom && textDom.removeAttribute && textDom.removeAttribute(idProp)
    }

    static stopAll() {
        SvgTextMonitor.observes.forEach(observer => {
            SvgTextMonitor.clearDom(observer.node.dom)
            observer.node.dom = null
            observer.disconnect()
            observer = null
        })
        SvgTextMonitor.observes = []
    }

    static destroyAll() {
        SvgTextMonitor.stopAll()
        SvgTextMonitor.instances.forEach(instance => {
            instance = null
        })
        SvgTextMonitor.instances = []
    }
}