/*!
 * inferno-create-class v1.0.0-beta9
 * (c) 2016 Dominic Gannaway
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('./inferno-component')) :
    typeof define === 'function' && define.amd ? define(['inferno-component'], factory) :
    (global.Inferno = global.Inferno || {}, global.Inferno.createClass = factory(global.Inferno.Component));
}(this, (function (Component) { 'use strict';

Component = 'default' in Component ? Component['default'] : Component;

var ERROR_MSG = 'a runtime error occured! Use Inferno in development environment to find the error.';





function isNullOrUndef(obj) {
    return isUndefined(obj) || isNull(obj);
}





function isNull(obj) {
    return obj === null;
}

function isUndefined(obj) {
    return obj === undefined;
}

// don't autobind these methods since they already have guaranteed context.
var AUTOBIND_BLACKLIST = {
    constructor: 1,
    render: 1,
    shouldComponentUpdate: 1,
    componentWillRecieveProps: 1,
    componentWillUpdate: 1,
    componentDidUpdate: 1,
    componentWillMount: 1,
    componentDidMount: 1,
    componentWillUnmount: 1,
    componentDidUnmount: 1
};
function extend(base, props, all) {
    for (var key in props) {
        if (all === true || !isNullOrUndef(props[key])) {
            base[key] = props[key];
        }
    }
    return base;
}
function bindAll(ctx) {
    for (var i in ctx) {
        var v = ctx[i];
        if (typeof v === 'function' && !v.__bound && !AUTOBIND_BLACKLIST[i]) {
            (ctx[i] = v.bind(ctx)).__bound = true;
        }
    }
}
function createClass$1(obj) {
    return _a = (function (Component$$1) {
        function Cl(props) {
                Component$$1.call(this, props);
                extend(this, obj);
                bindAll(this);
                if (obj.getInitialState) {
                    this.state = obj.getInitialState.call(this);
                }
            }

        if ( Component$$1 ) Cl.__proto__ = Component$$1;
        Cl.prototype = Object.create( Component$$1 && Component$$1.prototype );
        Cl.prototype.constructor = Cl;

        return Cl;
    }(Component)),
        _a.displayName = obj.displayName || 'Component',
        _a.propTypes = obj.propTypes,
        _a.defaultProps = obj.getDefaultProps ? obj.getDefaultProps() : undefined,
        _a;
    var _a;
}

return createClass$1;

})));
