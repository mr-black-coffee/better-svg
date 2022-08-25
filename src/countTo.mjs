import {
    createId
} from './tool.mjs'
import { requestAnimationFrame, cancelAnimationFrame } from './requestAnimationFrame.js'

const STATES = {
    NOT_PROCESSING: 'not_processing',
    PROCESSING: 'processing',
    PAUSED: 'paused',
    FINISHED: 'finished'
}

export class CountTo {
    // 内部id
    _id                 = ''
    // 根dom
    _container          = null
    // 选择器
    _selector           = ''
    // 存在多个选择结果时的序号
    _selectorIndex      = 0
    // dom
    _dom                = null
    // 起始值
    _start              = 0
    // 结束值
    _end                = 0
    // 小数位数
    _decimals           = 0
    // 小数位符号
    _decimal            = '.'
    // 时长
    _duration           = 1000
    // 自动执行
    _autoplay           = true
    // 数字分隔，毎3位数字增加逗号
    _enableSeparator    = true
    // 分隔器
    _separatorReg       = /(\d+)(\d{3})/
    // 分隔符, ','
    _separator          = ','
    // 前缀
    _prefix             = ''
    // 后缀
    _suffix             = ''
    // 使用缓动
    _useEasing          = true
    // 缓动函数
    // t: progress, b:this.localStartVal, c: this.endVal - this.localStartVal, d: this.localDuration
    _easingFn       = (t, b, c, d) => {
        return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
    }
    _legal          = true

    _localStartVal  = 0
    _displayValue   = 0
    _printVal       = null
    _paused         = false
    _localDuration  = 0
    _startTime      = null
    _timestamp      = null
    _remaining      = null
    _rAF            = null
    _state          = STATES.NOT_PROCESSING
    static _chainMap = new Map()

    constructor({
        selector,
        selectorIndex = 0,
        chainName = null,
        chainIndex = '',
        start = 0,
        end,
        decimals,
        decimal,
        duration,
        enableSeparator,
        separatorReg,
        separator,
        prefix,
        suffix,
        countDown,
        easingFn
    }, 
    container = document) {
        this._id = createId()
        let legal = true
        if (typeof start !== 'number') {
            legal = false
            console.log('countTo: start值必须为数字')
        }
        if (typeof end !== 'number') {
            legal = false
            console.log('countTo: end值必须为数字')
        }
        if (!legal) {
            this._legal = false
            return this
        }
        this._container                 = container
        this._selector                  = selector
        this._end                       = end
        selectorIndex                   && (this._selectorIndex = selectorIndex)
        start                           && (this._start = start)
        decimals                        && (this._decimals = decimals)
        decimal                         && (this._decimal = decimal)
        duration                        && (this._duration = duration)
        enableSeparator !== undefined   && (this._enableSeparator = enableSeparator)
        separatorReg                    && (this._separatorReg = separatorReg)
        separator                       && (this._separator = separator)
        prefix                          && (this._prefix = prefix)
        suffix                          && (this._suffix = suffix)
        easingFn                        && (this._easingFn = easingFn)
        countDown                       && (this.countDown = true)
        // 是否倒数
        this._countDown                 = this._start > this._end
        // dom
        const doms                      = container.querySelectorAll(selector)
        this._dom                       = doms[this?._selectorIndex ?? 0]

        // 初始值
        this._dom                       && (this._dom.innerHTML = this._start)

        // 执行链
        if (chainName && chainIndex !== void 0) {
            if (!CountTo._chainMap.has(chainName)) {
                CountTo._chainMap.set(chainName, [])
            }
            let list = CountTo._chainMap.get(chainName)
            CountTo._chainMap.set(chainName, [
                ...list.slice(0, chainIndex),
                {
                    id: this._id,
                },
                ...list.slice(chainIndex, list.length)
            ])
        }

        this.start          = this.start.bind(this)
        this.pause          = this.pause.bind(this)
        this.resume         = this.resume.bind(this)
        this.reset          = this.reset.bind(this)
        this.count          = this.count.bind(this)
        this.formatNumber   = this.formatNumber.bind(this)
        this.setValue       = this.setValue.bind(this)
        this.count          = this.count.bind(this)
    }

    start() {
        this._localStartVal = this._start;
        this._startTime     = null;
        this._localDuration = this._duration;
        this._paused        = false;
        this._state         = STATES.PROCESSING
        this._rAF           = requestAnimationFrame(this.count);
    }

    pause() {
        this._state = STATES.PAUSED
        cancelAnimationFrame(this._rAF);
    }

    resume() {
        this._startTime     = null;
        this._localDuration = +this._remaining;
        this._localStartVal = +this._printVal;
        this._state         = STATES.PROCESSING
        requestAnimationFrame(this.count);
    }

    reset() {
        this._startTime     = null;
        his._state          = STATES.NOT_PROCESSING
        cancelAnimationFrame(this._rAF);
        this._displayValue  = this.formatNumber(this._startVal);
        this.setValue(this._displayValue)
    }

    count(timestamp) {
        if (!this._startTime) this._startTime = timestamp;
        this._timestamp = timestamp;
        const progress = timestamp - this._startTime;
        this._remaining = this._localDuration - progress;

        if (this._useEasing) {
            if (this._countDown) {
                this._printVal = this._localStartVal - this._easingFn(progress, 0, this._localStartVal - this._end, this._localDuration)
            } else {
                this._printVal = this._easingFn(progress, this._localStartVal, this._end - this._localStartVal, this._localDuration);
            }
        } else {
            if (this._countDown) {
                this._printVal = this._localStartVal - ((this._localStartVal - this._end) * (progress / this._localDuration));
            } else {
                this._printVal = this._localStartVal + (this._end - this._localStartVal) * (progress / this._localDuration);
            }
        }
        if (this._countDown) {
            this._printVal = this._printVal < this._end ? this._end : this._printVal;
        } else {
            this._printVal = this._printVal > this._end ? this._end : this._printVal;
        }

        this._displayValue = this.formatNumber(this._printVal)
        this.setValue(this._displayValue)

        if (progress < this._localDuration) {
            this._rAF = requestAnimationFrame(this.count);
        } else {
            this._callback && this._callback()
        }
    }

    formatNumber(num) {
        num = num.toFixed(this._decimals);
        num += '';
        const x = num.split('.');
        let x1 = x[0];
        const x2 = x.length > 1 ? this._decimal + x[1] : '';
        const rgx = this._separatorReg;
        if (this._enableSeparator && this._separator && !CountTo.isNumber(this._separator)) {
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + this._separator + '$2');
            }
        }
        return this._prefix + x1 + x2 + this._suffix;
    }

    setValue(val) {
        this._dom && (this._dom.innerHTML = val)
    }

    static isNumber(val) {
        return !isNaN(parseFloat(val))
    }

    // 获取小数位数
    static getDecimals(num) {

    }

    static getNumber(num) {
        let _num
        let index
        let tempDecimals
        if (typeof num !== 'number') {
            index = num.indexOf('.')
            if (index > -1) {
                tempDecimals = num.length - index - 1
            }
            _num = +num
            if (isNaN(_num)) {
                console.warn('countTo: start不能转换为合法数字')
            }
        }
        return {

        }
    }

    static destroy() {
        CountTo._chainMap = new Map()
    }
}