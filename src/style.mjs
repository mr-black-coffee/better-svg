/**
 * 需要增加单位的 keyframes 属性
 * @enum
 */
export const TRANSLATED_ATTRS = {
    height: 'px',
    width: 'px',
}

/**
 * 操作种类
 * @enum
 */
export const OP_TYPES = {
    ADD_RULE: 'addRule', // 增加rule
    DELETE_RULE: 'deleteRule', // 删除rule
    CHANGE_RULE: 'changeRule', // 变更rule
}

/**
 * 是否是函数
 * @param { Object } target 
 * @returns { Boolean }
 */
function isFunction(target) {
    return typeof target === 'function'
}

/**
 * 工厂函数，生成一个在document.styleSheets列表中查找满足指定条件的css规则(rule)如某个类的css rules
 * @param { Number } ruleType rule 的类型 1: cssRule, 7: keyframesRule
 * @returns { Object }
 */
export function getRuleFinder(defaultKey = 'selectorText', defaultIsEqual = false, ruleType = 1) {
    /**
     * @param { Object } styleSheet document.styleSheets 列表项，样式表单对象
     * @param { String|RegExp|Function } selector 1. 如果是函数，则传入rule对象并应返回是否满足的布尔值，后两个参数无效,
     *   2. 如果是RegExp则返回key字段值的test结果，最后一个参数无效
     *   3. 如果是字符串，且非严格相等，则判断是否包含，如果是严格相等则使用 === 检测
     * @param { String } key 进行比对的属性名 style rule: cssText/selectorText等; keyframes rule: name
     * @param { Boolean } isEqual 是否严格相等，否则满足reg
     * @returns { Object } 检测结果
     */
    return (styleSheet, selector, key = defaultKey, isEqual = defaultIsEqual) => {
        const styleSheets = styleSheet
            ? [ styleSheet ]
            : document.styleSheets
        let type
        let rules
        let rule 
        for (let i = 0, len = styleSheets.length; i < len; i++) {
            rules = styleSheet.cssRules || styleSheet.rules
            if (rules) {
                for (let j = 0, len = Object.keys(rules).length; j < len; j++) {
                    rule = rules[j]
                    if (rule.type === ruleType) {
                        type = typeof selector
                        if (type === 'function' && selector(rules[j])) {
                            rule = {
                                key: j,
                                value: rules[j]
                            }
                        }
                        if (selector instanceof RegExp && selector.test(rules[j][key])) {
                            rule = {
                                key: j,
                                value: rules[j]
                            }
                        }
                        if (type === 'string') {
                            if (isEqual && rules[j][key] === selector) {
                                rule = {
                                    key: j,
                                    value: rules[j]
                                }
                            } else if (rules[j][key].toString().indexOf(selector) > -1){
                                rule = {
                                    key: j,
                                    value: rules[j]
                                }
                            }
                        }
                        if (rule) {
                            return rule
                        }
                    }
                }
            }
        }
        return null
    }
}

/**
 * 生成获取style rule的函数
 * @param { String } key 
 * @param { Boolean } isEqual 
 * @returns { Function }
 */
export function getStyleRuleFinder(key = 'selectorText', isEqual = false) {
    return getRuleFinder(key, isEqual)
}

/**
 * 生成获取keyframes rule的函数
 * @param { String } key 
 * @param { Boolean } isEqual 
 * @returns { Function }
 */
export function getKeyframesRuleFinder(key = 'name', isEqual = true) {
    return getRuleFinder(key, isEqual)
}

/**
 * 获取rule
 * @param { Function } finder keyframes finder 用来比对值得函数
 * @param { String } val 用来比对的值, 动画名称name(keyframes rule) 或 cssText/selectorText(style rule)
 * @param { Object } styleSheet styleSheet对象
 * @returns { Object } cssRule
 */
 export function getRule(finder, val, styleSheet) {
    if (val) {
        let styleSheets = styleSheet
            ? [ styleSheet ]
            : document.styleSheets
        let rule
        for (let i = 0, len = styleSheets.length; i < len; i++) {
            rule = finder(styleSheets[i], val)
            if (rule) {
                return rule
            }
        }
    }
}

/**
 * 获取样式表单
 * @param { Array } findConfigArr getRuleFinder生成的某一类 finder 函数
 * @param { String } val 要比对的值如 '.unit-text'判断是否有unit-text类
 * @returns { Object }
 */
export function getStyleSheet(findConfigArr, val) {
    let res = null
    let rule
    const finders = isFunction(findConfigArr)
        ? [findConfigArr]
        : Array.isArray(findConfigArr)
            ? findConfigArr
            : []
    if (finders.length){
        let styleSheet
        for (let i = 0, len = Object.keys(document.styleSheets).length; i < len; i++) {
            styleSheet = document.styleSheets[i]
            for (let j = 0, lenF = finders.length; j < lenF; j++) {
                if (isFunction(finders[j])) {
                    rule = finders[j](styleSheet, val)
                    if (rule) {
                        return {
                            styleSheet,
                            rule
                        }
                    }
                }
            }
        }
    }
    return res
}

/**
 * 在样式表单中增加规则
 * @param { Object } styleSheet 样式表单
 * @param { String } ruleText 规则内容
 */
export function addRule(styleSheet, ruleText) {
    if (styleSheet && ruleText) {
        styleSheet.appendRule && (styleSheet.insertRule = styleSheet.appendRule);
        styleSheet.insertRule(ruleText)
    }
}

/**
 * 删除rule
 * @param { Object } styleSheet 样式表单
 * @param { String|Number } key cssRules对象的key
 */
export function deleteRule(styleSheet, key) {
    styleSheet.deleteRule && styleSheet?.cssRules?.[key] && styleSheet.deleteRule(key)
}

/**
 * 获取动画名称 `@keyframes ani_name {... }` -> ani_name
 * @param { String } cssAnimationContent 
 * @returns { String }
 */
 export function getAnimationName(cssAnimationContent) {
    res = ''
    typeof cssAnimationContent === 'string' && (res = cssAnimationContent.match(/@keyframes\s+(\S+)\s+{/)?.[1])
    return res
}

/**
 * 获取用于css动画的值 (height/weight 值加'px')
 * @param { String } key attr属性名
 * @param { String } value 原始属性值 
 * @param { Object } translatedAttrs 需要增加单位的属性配置
 * @returns { String }
 */
export function getAttrValueForAnimation(key, value, translatedAttrs = TRANSLATED_ATTRS) {
    if (translatedAttrs[key]) {
        return `${value}${translatedAttrs[key]}`
    }
    return value + ''
}

/**
 * 获取finder的标识称，用于缓存
 * @param { String } key 
 * @param { Boolean } isEqual 
 * @param { Number } ruleType
 * @returns { String }
 */
export function getFinderName(key, isEqual, ruleType) {
    return `${key}_${isEqual}_${ruleType}`
}