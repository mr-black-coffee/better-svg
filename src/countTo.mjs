export class CountTo{
    _start = 0.0
    _end = 0.0
    _decimalPlaces = 0
    // 0: 从小到大，1: 从大到小
    _direction = 0
    _duration = 1000
    _autoplay = true
    // 数字分隔，如毎3位数字
    // 分隔器
    _separatorReg = /(\d+)(\d{3})/
    // 分隔符, ','
    _separator = ''
    _prefix = ''
    _suffix = ''
    useEasing = true
    easingFn = (t, b, c, d) => {
        return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
    }
    _legal = true

    constructor({ start, end, decimalPlaces, direction, duration, separatorReg, separator, prefix, suffix, useEasing, easingFn }) {
        // 
        let _start = start
        let _end = end
        
        let legal = true
        if (typeof start !== 'number') {
            legal = false
            console.warn('countTo: start值必须为数字')
        }
        if (typeof end !== 'number') {
            legal = false
            console.warn('countTo: end值必须为数字')
        }
        if (direction) {
            if (start < end) {
                console.warn('countTo: start值应大于等于end值')
            }
        } else {
            if (start > end) {
                console.warn('countTo: start值应小于等于end值')
            }
        }
        if (!legal) {
            this._legal = false
            return this
        }
        this._start = start
    }

    // 获取小数位数
    static getDecimalPlaces(num) {

    }

    static getNumber(num) {
        let _num
        let index
        let tempDecimalPlaces
        if (typeof num !== 'number') {
            index = num.indexOf('.')
            if (index > -1) {
                tempDecimalPlaces = num.length - index - 1
            }
            _num = +num
            if (isNaN(_num)) {
                console.warn('countTo: start不能转换为合法数字')
            }
        }
        return {
            
        }
    }
}