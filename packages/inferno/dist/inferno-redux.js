/*!
 * inferno-redux v0.8.0-alpha3
 * (c) 2016 Dominic Gannaway
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.InfernoRedux = factory());
}(this, (function () { 'use strict';

var Lifecycle = function Lifecycle() {
	this._listeners = [];
};
Lifecycle.prototype.addListener = function addListener (callback) {
	this._listeners.push(callback);
};
Lifecycle.prototype.trigger = function trigger () {
		var this$1 = this;

	for (var i = 0; i < this._listeners.length; i++) {
		this$1._listeners[i]();
	}
};

var NO_OP = 'NO_OP';

function toArray(children) {
	return isArray(children) ? children : (children ? [children] : children);
}

function isArray(obj) {
	return obj instanceof Array;
}

function isNullOrUndef(obj) {
	return isUndefined(obj) || isNull(obj);
}

function isFunction(obj) {
	return typeof obj === 'function';
}

function isNull(obj) {
	return obj === null;
}

function isUndefined(obj) {
	return obj === undefined;
}

var NodeTypes = {
	ELEMENT: 0,
	COMPONENT: 1,
	TEMPLATE: 2,
	TEXT: 3,
	PLACEHOLDER: 4,
	FRAGMENT: 5,
	VARIABLE: 6
};

var VComponent = function VComponent($component) {
	this._type = NodeTypes.COMPONENT;
	this._dom = null;
	this._component = $component;
	this._props = {};
	this._hooks = null;
	this._key = null;
	this._ref = null;
	this._isStateful = !isUndefined($component.prototype) && !isUndefined($component.prototype.render);
};
VComponent.prototype.key = function key ($key) {
	this._key = $key;
	return this;
};
VComponent.prototype.props = function props ($props) {
	this._props = $props;
	return this;
};
VComponent.prototype.hooks = function hooks ($hooks) {
	this._hooks = $hooks;
	return this;
};
VComponent.prototype.ref = function ref ($ref) {
	this._ref = $ref;
	return this;
};

var VPlaceholder = function VPlaceholder() {
	this._type = NodeTypes.PLACEHOLDER;
	this._dom = null;
};

function createVComponent(component) {
	return new VComponent(component);
}

function createVPlaceholder() {
	return new VPlaceholder();
}

var noOp = 'Inferno Error: Can only update a mounted or mounting component. This usually means you called setState() or forceUpdate() on an unmounted component. This is a no-op.';

// Copy of the util from dom/util, otherwise it makes massive bundles
function getActiveNode() {
	return document.activeElement;
}

// Copy of the util from dom/util, otherwise it makes massive bundles
function resetActiveNode(activeNode) {
	if (activeNode !== document.body && document.activeElement !== activeNode) {
		activeNode.focus(); // TODO: verify are we doing new focus event, if user has focus listener this might trigger it
	}
}

function queueStateChanges(component, newState, callback) {
	for (var stateKey in newState) {
		component._pendingState[stateKey] = newState[stateKey];
	}
	if (!component._pendingSetState) {
		component._pendingSetState = true;
		applyState(component, false, callback);
	} else {
		component.state = Object.assign({}, component.state, component._pendingState);
		component._pendingState = {};
	}
}

function applyState(component, force, callback) {
	if ((!component._deferSetState || force) && !component._blockRender) {
		component._pendingSetState = false;
		var pendingState = component._pendingState;
		var prevState = component.state;
		var nextState = Object.assign({}, prevState, pendingState);
		var props = component.props;

		component._pendingState = {};
		var nextInput = component._updateComponent(prevState, nextState, props, props, force);

		if (nextInput === NO_OP) {
			nextInput = component._lastInput;
		} else if (isNullOrUndef(nextInput)) {
			nextInput = createVPlaceholder();
		}
		var lastInput = component._lastInput;
		var parentDom = lastInput._dom.parentNode;
		var activeNode = getActiveNode();
		var subLifecycle = new Lifecycle();

		component._patch(lastInput, nextInput, parentDom, subLifecycle, component.context, component, null);
		component._lastInput = nextInput;
		component._vComponent._dom = nextInput._dom;
		component._componentToDOMNodeMap.set(component, nextInput.dom);
		component.componentDidUpdate(props, prevState);
		subLifecycle.trigger();
		if (!isNullOrUndef(callback)) {
			callback();
		}
		resetActiveNode(activeNode);
	}
}

var Component = function Component(props, context) {
	/** @type {object} */
	this.props = props || {};

	/** @type {object} */
	this.state = {};

	/** @type {object} */
	this.refs = {};
	this._blockRender = false;
	this._blockSetState = false;
	this._deferSetState = false;
	this._pendingSetState = false;
	this._pendingState = {};
	this._lastInput = null;
	this._vComponent = null;
	this._unmounted = true;
	this.context = context || {};
	this._patch = null;
	this._parentComponent = null;
	this._componentToDOMNodeMap = null;
};

Component.prototype.render = function render () {
};

Component.prototype.forceUpdate = function forceUpdate (callback) {
	if (this._unmounted) {
		throw Error(noOp);
	}
	applyState(this, true, callback);
};

Component.prototype.setState = function setState (newState, callback) {
	if (this._unmounted) {
		throw Error(noOp);
	}
	if (this._blockSetState === false) {
		queueStateChanges(this, newState, callback);
	} else {
		throw Error('Inferno Warning: Cannot update state via setState() in componentWillUpdate()');
	}
};

Component.prototype.componentDidMount = function componentDidMount () {
};

Component.prototype.componentWillMount = function componentWillMount () {
};

Component.prototype.componentWillUnmount = function componentWillUnmount () {
};

Component.prototype.componentDidUpdate = function componentDidUpdate () {
};

Component.prototype.shouldComponentUpdate = function shouldComponentUpdate () {
	return true;
};

Component.prototype.componentWillReceiveProps = function componentWillReceiveProps () {
};

Component.prototype.componentWillUpdate = function componentWillUpdate () {
};

Component.prototype.getChildContext = function getChildContext () {
};

Component.prototype._updateComponent = function _updateComponent (prevState, nextState, prevProps, nextProps, force) {
	if (this._unmounted === true) {
		this._unmounted = false;
		return NO_OP;
	}
	if (!isNullOrUndef(nextProps) && isNullOrUndef(nextProps.children)) {
		nextProps.children = prevProps.children;
	}
	if (prevProps !== nextProps || prevState !== nextState || force) {
		if (prevProps !== nextProps) {
			this._blockRender = true;
			this.componentWillReceiveProps(nextProps);
			this._blockRender = false;
			if (this._pendingSetState) {
				nextState = Object.assign({}, nextState, this._pendingState);
				this._pendingSetState = false;
				this._pendingState = {};
			}
		}
		var shouldUpdate = this.shouldComponentUpdate(nextProps, nextState);

		if (shouldUpdate !== false || force) {
			this._blockSetState = true;
			this.componentWillUpdate(nextProps, nextState);
			this._blockSetState = false;
			this.props = nextProps;
			this.state = nextState;
			return this.render();
		}
	}
	return NO_OP;
};

var funcProto = Function.prototype;
/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

function interopDefault(ex) {
	return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var ponyfill = createCommonjsModule(function (module) {
'use strict';

module.exports = function symbolObservablePonyfill(root) {
	var result;
	var Symbol = root.Symbol;

	if (typeof Symbol === 'function') {
		if (Symbol.observable) {
			result = Symbol.observable;
		} else {
			result = Symbol('observable');
			Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
};
});

var ponyfill$1 = interopDefault(ponyfill);


var require$$0 = Object.freeze({
	default: ponyfill$1
});

var index$1 = createCommonjsModule(function (module) {
/* global window */
'use strict';

module.exports = interopDefault(require$$0)(commonjsGlobal || window || commonjsGlobal);
});

interopDefault(index$1);

function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(undefined, arguments));
  };
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */
function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error('bindActionCreators expected an object or a function, instead received ' + (actionCreators === null ? 'null' : typeof actionCreators) + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
  }

  var keys = Object.keys(actionCreators);
  var boundActionCreators = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var actionCreator = actionCreators[key];
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }
  return boundActionCreators;
}

/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
function warning(message) {
	/* eslint-disable no-console */
	if (typeof console !== 'undefined' && typeof console.error === 'function') {
		console.error(message);
	}

	/* eslint-enable no-console */
	try {
		// This error was thrown as a convenience so that if you enable
		// "break on all exceptions" in your console,
		// it would pause the execution at this line.
		throw new Error(message);

		/* eslint-disable no-empty */
	} catch (e) {}

	/* eslint-enable no-empty */
}

function shallowEqual(objA, objB) {
	if (objA === objB) {
		return true;
	}
	var keysA = Object.keys(objA);
	var keysB = Object.keys(objB);

	if (keysA.length !== keysB.length) {
		return false;
	}
	// Test for A's keys different from B.
	var hasOwn = Object.prototype.hasOwnProperty;
	for (var i = 0; i < keysA.length; i++) {
		if (!hasOwn.call(objB, keysA[i]) ||
			objA[keysA[i]] !== objB[keysA[i]]) {
			return false;
		}
	}
	return true;
}

function wrapActionCreators(actionCreators) {
	return function (dispatch) { return bindActionCreators(actionCreators, dispatch); };
}

var Provider = (function (Component) {
	function Provider(props, context) {
		Component.call(this, props, context);
		this.store = props.store;
	}

	if ( Component ) Provider.__proto__ = Component;
	Provider.prototype = Object.create( Component && Component.prototype );
	Provider.prototype.constructor = Provider;

	Provider.prototype.getChildContext = function getChildContext () {
		return { store: this.store };
	};

	Provider.prototype.render = function render () {
		if (isNullOrUndef(this.props.children) || toArray(this.props.children).length !== 1) {
			throw Error('Inferno Error: Only one child is allowed within the `Provider` component');
		}

		return this.props.children;
	};

	return Provider;
}(Component));

var index$2 = createCommonjsModule(function (module) {
'use strict';

var INFERNO_STATICS = {
    childContextTypes: true,
    contextTypes: true,
    defaultProps: true,
    displayName: true,
    getDefaultProps: true,
    propTypes: true,
    type: true
};

var KNOWN_STATICS = {
    name: true,
    length: true,
    prototype: true,
    caller: true,
    arguments: true,
    arity: true
};

var isGetOwnPropertySymbolsAvailable = typeof Object.getOwnPropertySymbols === 'function';

function hoistNonReactStatics(targetComponent, sourceComponent, customStatics) {
    if (typeof sourceComponent !== 'string') { // don't hoist over string (html) components
        var keys = Object.getOwnPropertyNames(sourceComponent);

        /* istanbul ignore else */
        if (isGetOwnPropertySymbolsAvailable) {
            keys = keys.concat(Object.getOwnPropertySymbols(sourceComponent));
        }

        for (var i = 0; i < keys.length; ++i) {
            if (!INFERNO_STATICS[keys[i]] && !KNOWN_STATICS[keys[i]] && (!customStatics || !customStatics[keys[i]])) {
                try {
                    targetComponent[keys[i]] = sourceComponent[keys[i]];
                } catch (error) {

                }
            }
        }
    }

    return targetComponent;
};

module.exports = hoistNonReactStatics;
});

var hoistStatics = interopDefault(index$2);

var invariant = createCommonjsModule(function (module) {
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var NODE_ENV = "production";

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;
});

var invariant$1 = interopDefault(invariant);

var errorObject = { value: null };
var defaultMapStateToProps = function (state) { return ({}); }; // eslint-disable-line no-unused-vars
var defaultMapDispatchToProps = function (dispatch) { return ({ dispatch: dispatch }); };
var defaultMergeProps = function (stateProps, dispatchProps, parentProps) { return (Object.assign({}, parentProps,
	stateProps,
	dispatchProps)); };

function tryCatch(fn, ctx) {
	try {
		return fn.apply(ctx);
	} catch (e) {
		errorObject.value = e;
		return errorObject;
	}
}

function getDisplayName(WrappedComponent) {
	return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

// Helps track hot reloading.
var nextVersion = 0;

function connect(mapStateToProps, mapDispatchToProps, mergeProps, options) {
	if ( options === void 0 ) options = {};

	var shouldSubscribe = Boolean(mapStateToProps);
	var mapState = mapStateToProps || defaultMapStateToProps;
	var mapDispatch;

	if (isFunction(mapDispatchToProps)) {
		mapDispatch = mapDispatchToProps;
	} else if (!mapDispatchToProps) {
		mapDispatch = defaultMapDispatchToProps;
	} else {
		mapDispatch = wrapActionCreators(mapDispatchToProps);
	}
	var finalMergeProps = mergeProps || defaultMergeProps;
	var pure = options.pure; if ( pure === void 0 ) pure = true;
	var withRef = options.withRef; if ( withRef === void 0 ) withRef = false;
	var checkMergedEquals = pure && finalMergeProps !== defaultMergeProps;
	// Helps track hot reloading.
	var version = nextVersion++;

	return function wrapWithConnect(WrappedComponent) {
		var connectDisplayName = "Connect(" + (getDisplayName(WrappedComponent)) + ")";

		function checkStateShape(props, methodName) {
			if (!isPlainObject(props)) {
				warning(
					methodName + "() in " + connectDisplayName + " must return a plain object. " +
					"Instead received " + props + "."
				);
			}
		}
		function computeMergedProps(stateProps, dispatchProps, parentProps) {
			var mergedProps = finalMergeProps(stateProps, dispatchProps, parentProps);
			if ("production" !== 'production') {}
			return mergedProps;
		}

		var Connect = (function (Component) {
			function Connect(props, context) {
				Component.call(this, props, context);

				this.version = version;
				this.store = (props && props.store) || (context && context.store);

				invariant$1(this.store,
					'Could not find "store" in either the context or ' +
					"props of \"" + connectDisplayName + "\". " +
					'Either wrap the root component in a <Provider>, ' +
					"or explicitly pass \"store\" as a prop to \"" + connectDisplayName + "\"."
				);

				var storeState = this.store.getState();
				this.state = { storeState: storeState };
				this.clearCache();
			}

			if ( Component ) Connect.__proto__ = Component;
			Connect.prototype = Object.create( Component && Component.prototype );
			Connect.prototype.constructor = Connect;
			Connect.prototype.shouldComponentUpdate = function shouldComponentUpdate () {
				return !pure || this.haveOwnPropsChanged || this.hasStoreStateChanged;
			};

			Connect.prototype.computeStateProps = function computeStateProps (store, props) {
				if (!this.finalMapStateToProps) {
					return this.configureFinalMapState(store, props);
				}
				var state = store.getState();
				var stateProps = this.doStatePropsDependOnOwnProps ?
					this.finalMapStateToProps(state, props) :
					this.finalMapStateToProps(state);

				return stateProps;
			};
			Connect.prototype.configureFinalMapState = function configureFinalMapState (store, props) {
				var mappedState = mapState(store.getState(), props);
				var isFactory = isFunction(mappedState);

				this.finalMapStateToProps = isFactory ? mappedState : mapState;
				this.doStatePropsDependOnOwnProps = this.finalMapStateToProps.length !== 1;
				if (isFactory) {
					return this.computeStateProps(store, props);
				}
				return mappedState;
			};
			Connect.prototype.computeDispatchProps = function computeDispatchProps (store, props) {
				if (!this.finalMapDispatchToProps) {
					return this.configureFinalMapDispatch(store, props);
				}
				var dispatch = store.dispatch;
				var dispatchProps = this.doDispatchPropsDependOnOwnProps ?
					this.finalMapDispatchToProps(dispatch, props) :
					this.finalMapDispatchToProps(dispatch);

				return dispatchProps;
			};
			Connect.prototype.configureFinalMapDispatch = function configureFinalMapDispatch (store, props) {
				var mappedDispatch = mapDispatch(store.dispatch, props);
				var isFactory = isFunction(mappedDispatch);

				this.finalMapDispatchToProps = isFactory ? mappedDispatch : mapDispatch;
				this.doDispatchPropsDependOnOwnProps = this.finalMapDispatchToProps.length !== 1;

				if (isFactory) {
					return this.computeDispatchProps(store, props);
				}
				return mappedDispatch;
			};
			Connect.prototype.updateStatePropsIfNeeded = function updateStatePropsIfNeeded () {
				var nextStateProps = this.computeStateProps(this.store, this.props);

				if (this.stateProps && shallowEqual(nextStateProps, this.stateProps)) {
					return false;
				}
				this.stateProps = nextStateProps;
				return true;
			};
			Connect.prototype.updateDispatchPropsIfNeeded = function updateDispatchPropsIfNeeded () {
				var nextDispatchProps = this.computeDispatchProps(this.store, this.props);

				if (this.dispatchProps && shallowEqual(nextDispatchProps, this.dispatchProps)) {
					return false;
				}
				this.dispatchProps = nextDispatchProps;
				return true;
			};
			Connect.prototype.updateMergedPropsIfNeeded = function updateMergedPropsIfNeeded () {
				var nextMergedProps = computeMergedProps(this.stateProps, this.dispatchProps, this.props);

				if (this.mergedProps && checkMergedEquals && shallowEqual(nextMergedProps, this.mergedProps)) {
					return false;
				}
				this.mergedProps = nextMergedProps;
				return true;
			};
			Connect.prototype.isSubscribed = function isSubscribed () {
				return isFunction(this.unsubscribe);
			};
			Connect.prototype.trySubscribe = function trySubscribe () {
				if (shouldSubscribe && !this.unsubscribe) {
					this.unsubscribe = this.store.subscribe(this.handleChange.bind(this));
					this.handleChange();
				}
			};
			Connect.prototype.tryUnsubscribe = function tryUnsubscribe () {
				if (this.unsubscribe) {
					this.unsubscribe();
					this.unsubscribe = null;
				}
			};
			Connect.prototype.componentDidMount = function componentDidMount () {
				this.trySubscribe();
			};
			Connect.prototype.componentWillReceiveProps = function componentWillReceiveProps (nextProps) {
				if (!pure || !shallowEqual(nextProps, this.props)) {
					this.haveOwnPropsChanged = true;
				}
			};
			Connect.prototype.componentWillUnmount = function componentWillUnmount () {
				this.tryUnsubscribe();
				this.clearCache();
			};
			Connect.prototype.clearCache = function clearCache () {
				this.dispatchProps = null;
				this.stateProps = null;
				this.mergedProps = null;
				this.haveOwnPropsChanged = true;
				this.hasStoreStateChanged = true;
				this.haveStatePropsBeenPrecalculated = false;
				this.statePropsPrecalculationError = null;
				this.renderedElement = null;
				this.finalMapDispatchToProps = null;
				this.finalMapStateToProps = null;
			};
			Connect.prototype.handleChange = function handleChange () {
				if (!this.unsubscribe) {
					return;
				}
				var storeState = this.store.getState();
				var prevStoreState = this.state.storeState;

				if (pure && prevStoreState === storeState) {
					return;
				}
				if (pure && !this.doStatePropsDependOnOwnProps) {
					var haveStatePropsChanged = tryCatch(this.updateStatePropsIfNeeded, this);
					if (!haveStatePropsChanged) {
						return;
					}
					if (haveStatePropsChanged === errorObject) {
						this.statePropsPrecalculationError = errorObject.value;
					}
					this.haveStatePropsBeenPrecalculated = true;
				}
				this.hasStoreStateChanged = true;
				this.setState({ storeState: storeState });
			};
			Connect.prototype.getWrappedInstance = function getWrappedInstance () {
				return this.refs.wrappedInstance;
			};
			Connect.prototype.render = function render () {
				var ref = this;
				var haveOwnPropsChanged = ref.haveOwnPropsChanged;
				var hasStoreStateChanged = ref.hasStoreStateChanged;
				var haveStatePropsBeenPrecalculated = ref.haveStatePropsBeenPrecalculated;
				var statePropsPrecalculationError = ref.statePropsPrecalculationError;
				var renderedElement = ref.renderedElement;

				this.haveOwnPropsChanged = false;
				this.hasStoreStateChanged = false;
				this.haveStatePropsBeenPrecalculated = false;
				this.statePropsPrecalculationError = null;

				if (statePropsPrecalculationError) {
					throw statePropsPrecalculationError;
				}
				var shouldUpdateStateProps = true;
				var shouldUpdateDispatchProps = true;

				if (pure && renderedElement) {
					shouldUpdateStateProps = hasStoreStateChanged || (
						haveOwnPropsChanged && this.doStatePropsDependOnOwnProps
					);
					shouldUpdateDispatchProps =
						haveOwnPropsChanged && this.doDispatchPropsDependOnOwnProps;
				}
				var haveStatePropsChanged = false;
				var haveDispatchPropsChanged = false;

				if (haveStatePropsBeenPrecalculated) {
					haveStatePropsChanged = true;
				} else if (shouldUpdateStateProps) {
					haveStatePropsChanged = this.updateStatePropsIfNeeded();
				}
				if (shouldUpdateDispatchProps) {
					haveDispatchPropsChanged = this.updateDispatchPropsIfNeeded();
				}
				var haveMergedPropsChanged = true;

				if (
					haveStatePropsChanged ||
					haveDispatchPropsChanged ||
					haveOwnPropsChanged
				) {
					haveMergedPropsChanged = this.updateMergedPropsIfNeeded();
				} else {
					haveMergedPropsChanged = false;
				}

				if (!haveMergedPropsChanged && renderedElement) {
					return renderedElement;
				}
				if (withRef) {
					this.renderedElement = createVComponent(WrappedComponent)
						.props(Object.assign({}, this.mergedProps, { ref: 'wrappedInstance' }));
				} else {
					this.renderedElement = createVComponent(WrappedComponent)
						.props(this.mergedProps);
				}
				return this.renderedElement;
			};

			return Connect;
		}(Component));
		Connect.displayName = connectDisplayName;
		Connect.WrappedComponent = WrappedComponent;

		if ("production" !== 'production') {}
		return hoistStatics(Connect, WrappedComponent);
	};
}

var index = {
	Provider: Provider,
	connect: connect,
};

return index;

})));