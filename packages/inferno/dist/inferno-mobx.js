/*!
 * inferno-mobx v1.0.0-beta7
 * (c) 2016 Ryan Megidov
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('./inferno-component'), require('mobx'), require('./inferno'), require('./inferno-create-class'), require('hoist-non-inferno-statics'), require('./inferno-create-element')) :
	typeof define === 'function' && define.amd ? define(['inferno-component', 'mobx', 'inferno', 'inferno-create-class', 'hoist-non-inferno-statics', 'inferno-create-element'], factory) :
	(global.InfernoMobx = factory(global.Component,global.mobx,global.Inferno,global.createClass,global.hoistStatics,global.createElement));
}(this, (function (Component,mobx,Inferno,createClass,hoistStatics,createElement) { 'use strict';

Component = 'default' in Component ? Component['default'] : Component;
Inferno = 'default' in Inferno ? Inferno['default'] : Inferno;
createClass = 'default' in createClass ? createClass['default'] : createClass;
hoistStatics = 'default' in hoistStatics ? hoistStatics['default'] : hoistStatics;
createElement = 'default' in createElement ? createElement['default'] : createElement;

var ERROR_MSG = 'a runtime error occured! Use Inferno in development environment to find the error.';















function throwError(message) {
    if (!message) {
        message = ERROR_MSG;
    }
    throw new Error(("Inferno Error: " + message));
}
function warning(condition, message) {
    if (!condition) {
        console.error(message);
    }
}

var specialKeys = {
    children: true,
    key: true,
    ref: true
};
var Provider = (function (Component$$1) {
    function Provider(props, context) {
        Component$$1.call(this, props, context);
        this.contextTypes = { mobxStores: function mobxStores() { } };
        this.childContextTypes = { mobxStores: function mobxStores$1() { } };
        this.store = props.store;
    }

    if ( Component$$1 ) Provider.__proto__ = Component$$1;
    Provider.prototype = Object.create( Component$$1 && Component$$1.prototype );
    Provider.prototype.constructor = Provider;
    Provider.prototype.render = function render () {
        return this.props.children;
    };
    Provider.prototype.getChildContext = function getChildContext () {
        var this$1 = this;

        var stores = {};
        // inherit stores
        var baseStores = this.context.mobxStores;
        if (baseStores) {
            for (var key in baseStores) {
                stores[key] = baseStores[key];
            }
        }
        // add own stores
        for (var key$1 in this.props) {
            if (!specialKeys[key$1]) {
                stores[key$1] = this$1.props[key$1];
            }
        }
        return {
            mobxStores: stores
        };
    };

    return Provider;
}(Component));

if (process.env.NODE_ENV !== 'production') {
    Provider.prototype.componentWillReceiveProps = function (nextProps) {
        var this$1 = this;

        // Maybe this warning is to aggressive?
        warning(Object.keys(nextProps).length === Object.keys(this.props).length, 'MobX Provider: The set of provided stores has changed. ' +
            'Please avoid changing stores as the change might not propagate to all children');
        for (var key in nextProps) {
            warning(specialKeys[key] || this$1.props[key] === nextProps[key], "MobX Provider: Provided store '" + key + "' has changed. " +
                "Please avoid replacing stores as the change might not propagate to all children");
        }
    };
}

var EventEmitter = function EventEmitter() {
    this.listeners = [];
};
EventEmitter.prototype.on = function on (cb) {
        var this$1 = this;

    this.listeners.push(cb);
    return function () {
        var index = this$1.listeners.indexOf(cb);
        if (index !== -1) {
            this$1.listeners.splice(index, 1);
        }
    };
};
EventEmitter.prototype.emit = function emit (data) {
    this.listeners.forEach(function (fn) { return fn(data); });
};

EventEmitter.prototype.getTotalListeners = function getTotalListeners () {
    return this.listeners.length;
};
EventEmitter.prototype.clearListeners = function clearListeners () {
    this.listeners = [];
};

var findDOMNode = Inferno.findDOMNode;
/**
 * Dev tools support
 */
var isDevtoolsEnabled = false;
var componentByNodeRegistery = new WeakMap();
var renderReporter = new EventEmitter();
function reportRendering(component) {
    var node = findDOMNode(component);
    if (node && componentByNodeRegistery) {
        componentByNodeRegistery.set(node, component);
    }
    renderReporter.emit({
        event: 'render',
        renderTime: component.__$mobRenderEnd - component.__$mobRenderStart,
        totalTime: Date.now() - component.__$mobRenderStart,
        component: component,
        node: node
    });
}
function trackComponents() {
    if (typeof WeakMap === 'undefined') {
        throwError('[inferno-mobx] tracking components is not supported in this browser.');
    }
    if (!isDevtoolsEnabled) {
        isDevtoolsEnabled = true;
    }
}
function makeReactive(componentClass) {
    var target = componentClass.prototype || componentClass;
    var baseDidMount = target.componentDidMount;
    var baseWillMount = target.componentWillMount;
    var baseUnmount = target.componentWillUnmount;
    target.componentWillMount = function () {
        var this$1 = this;

        // Call original
        baseWillMount && baseWillMount.call(this);
        var reaction;
        var isRenderingPending = false;
        var initialName = this.displayName || this.name || (this.constructor && (this.constructor.displayName || this.constructor.name)) || "<component>";
        var baseRender = this.render.bind(this);
        var initialRender = function (nextProps, nextContext) {
            reaction = new mobx.Reaction((initialName + ".render()"), function () {
                if (!isRenderingPending) {
                    isRenderingPending = true;
                    if (this$1.__$mobxIsUnmounted !== true) {
                        var hasError = true;
                        try {
                            Component.prototype.forceUpdate.call(this$1);
                            hasError = false;
                        }
                        finally {
                            if (hasError) {
                                reaction.dispose();
                            }
                        }
                    }
                }
            });
            reactiveRender.$mobx = reaction;
            this$1.render = reactiveRender;
            return reactiveRender(nextProps, nextContext);
        };
        var reactiveRender = function (nextProps, nextContext) {
            isRenderingPending = false;
            var rendering = undefined;
            reaction.track(function () {
                if (isDevtoolsEnabled) {
                    this$1.__$mobRenderStart = Date.now();
                }
                rendering = mobx.extras.allowStateChanges(false, baseRender.bind(this$1, nextProps, nextContext));
                if (isDevtoolsEnabled) {
                    this$1.__$mobRenderEnd = Date.now();
                }
            });
            return rendering;
        };
        this.render = initialRender;
    };
    target.componentDidMount = function () {
        isDevtoolsEnabled && reportRendering(this);
        // Call original
        baseDidMount && baseDidMount.call(this);
    };
    target.componentWillUnmount = function () {
        // Call original
        baseUnmount && baseUnmount.call(this);
        // Dispose observables
        this.render.$mobx && this.render.$mobx.dispose();
        this.__$mobxIsUnmounted = true;
        if (isDevtoolsEnabled) {
            var node = findDOMNode(this);
            if (node && componentByNodeRegistery) {
                componentByNodeRegistery.delete(node);
            }
            renderReporter.emit({
                event: 'destroy',
                component: this,
                node: node
            });
        }
    };
    target.shouldComponentUpdate = function (nextProps, nextState) {
        var this$1 = this;

        // Update on any state changes (as is the default)
        if (this.state !== nextState) {
            return true;
        }
        // Update if props are shallowly not equal, inspired by PureRenderMixin
        var keys = Object.keys(this.props);
        if (keys.length !== Object.keys(nextProps).length) {
            return true;
        }
        for (var i = keys.length - 1; i >= 0; i--) {
            var key = keys[i];
            var newValue = nextProps[key];
            if (newValue !== this$1.props[key]) {
                return true;
            }
            else if (newValue && typeof newValue === 'object' && !mobx.isObservable(newValue)) {
                // If the newValue is still the same object, but that object is not observable,
                // fallback to the default behavior: update, because the object *might* have changed.
                return true;
            }
        }
        return true;
    };
    return componentClass;
}

/**
 * Store Injection
 */
function createStoreInjector(grabStoresFn, component) {
    var Injector = createClass({
        displayName: component.name,
        render: function render() {
            var this$1 = this;

            var newProps = {};
            for (var key in this.props) {
                if (this$1.props.hasOwnProperty(key)) {
                    newProps[key] = this$1.props[key];
                }
            }
            var additionalProps = grabStoresFn(this.context.mobxStores || {}, newProps, this.context) || {};
            for (var key$1 in additionalProps) {
                newProps[key$1] = additionalProps[key$1];
            }
            newProps.ref = function (instance) {
                this$1.wrappedInstance = instance;
            };
            return createElement(component, newProps);
        }
    });
    Injector.contextTypes = { mobxStores: function mobxStores() { } };
    hoistStatics(Injector, component);
    return Injector;
}
var grabStoresByName = function (storeNames) { return function (baseStores, nextProps) {
    storeNames.forEach(function (storeName) {
        // Prefer props over stores
        if (storeName in nextProps) {
            return;
        }
        if (!(storeName in baseStores)) {
            throw new Error("MobX observer: Store \"" + storeName + "\" is not available! " +
                "Make sure it is provided by some Provider");
        }
        nextProps[storeName] = baseStores[storeName];
    });
    return nextProps;
}; };
/**
 * Higher order component that injects stores to a child.
 * takes either a varargs list of strings, which are stores read from the context,
 * or a function that manually maps the available stores from the context to props:
 * storesToProps(mobxStores, props, context) => newProps
 */
function inject(grabStoresFn) {
    var arguments$1 = arguments;

    if (typeof grabStoresFn !== 'function') {
        var storesNames = [];
        for (var i = 0; i < arguments.length; i++) {
            storesNames[i] = arguments$1[i];
        }
        grabStoresFn = grabStoresByName(storesNames);
    }
    return function (componentClass) { return createStoreInjector(grabStoresFn, componentClass); };
}

/**
 * Wraps a component and provides stores as props
 */
function connect(arg1, arg2) {
    if ( arg2 === void 0 ) arg2 = null;

    if (typeof arg1 === 'string') {
        throwError('Store names should be provided as array');
    }
    if (Array.isArray(arg1)) {
        // component needs stores
        if (!arg2) {
            // invoked as decorator
            return function (componentClass) { return connect(arg1, componentClass); };
        }
        else {
            // TODO: deprecate this invocation style
            return inject.apply(null, arg1)(connect(arg2));
        }
    }
    var componentClass = arg1;
    // Stateless function component:
    // If it is function but doesn't seem to be a Inferno class constructor,
    // wrap it to a Inferno class automatically
    if (typeof componentClass === 'function'
        && (!componentClass.prototype || !componentClass.prototype.render)
        && !componentClass.isReactClass
        && !Component.isPrototypeOf(componentClass)) {
        var newClass = createClass({
            displayName: componentClass.displayName || componentClass.name,
            propTypes: componentClass.propTypes,
            contextTypes: componentClass.contextTypes,
            getDefaultProps: function () { return componentClass.defaultProps; },
            render: function render() {
                return componentClass.call(this, this.props, this.context);
            }
        });
        return connect(newClass);
    }
    if (!componentClass) {
        throwError('Please pass a valid component to "observer"');
    }
    componentClass.isMobXReactObserver = true;
    return makeReactive(componentClass);
}

var index = {
	Provider: Provider,
	inject: inject,
	connect: connect,
	observer: connect,
	trackComponents: trackComponents,
	renderReporter: renderReporter,
	componentByNodeRegistery: componentByNodeRegistery
};

return index;

})));
