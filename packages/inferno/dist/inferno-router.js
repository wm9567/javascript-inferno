/*!
 * inferno-router v1.0.0-beta12
 * (c) 2016 Dominic Gannaway
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('./inferno-create-element'), require('./inferno-component'), require('./inferno')) :
  typeof define === 'function' && define.amd ? define(['inferno-create-element', 'inferno-component', 'inferno'], factory) :
  (global.Inferno = global.Inferno || {}, global.Inferno.Router = factory(global.Inferno.createElement,global.Inferno.Component,global.Inferno));
}(this, (function (createElement,Component,Inferno) { 'use strict';

createElement = 'default' in createElement ? createElement['default'] : createElement;
Component = 'default' in Component ? Component['default'] : Component;
Inferno = 'default' in Inferno ? Inferno['default'] : Inferno;

function Link(props, ref) {
    var router = ref.router;

    var activeClassName = props.activeClassName;
    var activeStyle = props.activeStyle;
    var className = props.className;
    var to = props.to;
    var elemProps = {
        href: to
    };
    if (className) {
        elemProps.className = className;
    }
    if (router.location.pathname === to) {
        if (activeClassName) {
            elemProps.className = (className ? className + ' ' : '') + activeClassName;
        }
        if (activeStyle) {
            elemProps.style = Object.assign({}, props.style, activeStyle);
        }
    }
    elemProps.onclick = function navigate(e) {
        if (e.button !== 0 || e.ctrlKey || e.altKey) {
            return;
        }
        e.preventDefault();
        router.push(to, e.target.textContent);
    };
    return createElement('a', elemProps, props.children);
}

function IndexLink(props) {
    props.to = '/';
    return createElement(Link, props);
}

var Route = (function (Component$$1) {
    function Route(props, context) {
        Component$$1.call(this, props, context);
    }

    if ( Component$$1 ) Route.__proto__ = Component$$1;
    Route.prototype = Object.create( Component$$1 && Component$$1.prototype );
    Route.prototype.constructor = Route;
    Route.prototype.componentWillMount = function componentWillMount () {
        var this$1 = this;

        var ref = this.props;
        var onEnter = ref.onEnter;
        var ref$1 = this.context;
        var router = ref$1.router;
        if (onEnter) {
            setImmediate(function () {
                onEnter({ props: this$1.props, router: router });
            });
        }
    };
    Route.prototype.componentWillUnmount = function componentWillUnmount () {
        var ref = this.props;
        var onLeave = ref.onLeave;
        var ref$1 = this.context;
        var router = ref$1.router;
        if (onLeave) {
            onLeave({ props: this.props, router: router });
        }
    };
    Route.prototype.render = function render (ref) {
        var component = ref.component;
        var children = ref.children;
        var params = ref.params;

        return createElement(component, {
            params: params,
            children: children
        });
    };

    return Route;
}(Component));

var IndexRoute = (function (Route$$1) {
    function IndexRoute () {
        Route$$1.apply(this, arguments);
    }

    if ( Route$$1 ) IndexRoute.__proto__ = Route$$1;
    IndexRoute.prototype = Object.create( Route$$1 && Route$$1.prototype );
    IndexRoute.prototype.constructor = IndexRoute;

    IndexRoute.prototype.render = function render (ref) {
        var component = ref.component;
        var children = ref.children;
        var params = ref.params;
        var path = ref.path; if ( path === void 0 ) path = '/';

        return createElement(component, {
            path: path,
            params: params,
            children: children
        });
    };

    return IndexRoute;
}(Route));

var ERROR_MSG = 'a runtime error occured! Use Inferno in development environment to find the error.';

function toArray(children) {
    return isArray(children) ? children : (children ? [children] : children);
}
function isArray(obj) {
    return obj instanceof Array;
}






function isString(obj) {
    return typeof obj === 'string';
}

var emptyObject = Object.create(null);
function decode(val) {
    return typeof val !== 'string' ? val : decodeURIComponent(val);
}
function isEmpty(children) {
    return !children || !(isArray(children) ? children : Object.keys(children)).length;
}
function flatten(oldArray) {
    var newArray = [];
    flattenArray(oldArray, newArray);
    return newArray;
}
function getURLString(location) {
    return isString(location) ? location : (location.pathname + location.search);
}
/**
 * Maps a querystring to an object
 * Supports arrays and utf-8 characters
 * @param search
 * @returns {any}
 */
function mapSearchParams(search) {
    if (search === '') {
        return emptyObject;
    }
    // Create an object with no prototype
    var map = Object.create(null);
    var fragment = search.split('&');
    for (var i = 0; i < fragment.length; i++) {
        var ref = fragment[i].split('=').map(mapFragment);
        var k = ref[0];
        var v = ref[1];
        if (map[k]) {
            map[k] = isArray(map[k]) ? map[k] : [map[k]];
            map[k].push(v);
        }
        else {
            map[k] = v;
        }
    }
    return map;
}
/**
 * Sorts an array according to its `path` prop length
 * @param a
 * @param b
 * @returns {number}
 */
function pathRankSort(a, b) {
    var aAttr = a.props || emptyObject;
    var bAttr = b.props || emptyObject;
    var diff = rank(bAttr.path) - rank(aAttr.path);
    return diff || (bAttr.path && aAttr.path) ? (bAttr.path.length - aAttr.path.length) : 0;
}
/**
 * Helper function for parsing querystring arrays
 */
function mapFragment(p, isVal) {
    return decodeURIComponent(isVal | 0 ? p : p.replace('[]', ''));
}
function strip(url) {
    return url.replace(/(^\/+|\/+$)/g, '');
}
function rank(url) {
    if ( url === void 0 ) url = '';

    return (strip(url).match(/\/+/g) || '').length;
}
function flattenArray(oldArray, newArray) {
    for (var i = 0; i < oldArray.length; i++) {
        var item = oldArray[i];
        if (isArray(item)) {
            flattenArray(item, newArray);
        }
        else {
            newArray.push(item);
        }
    }
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

/**
 * Expose `pathtoRegexp`.
 */

var index$2 = pathtoRegexp;

/**
 * Match matching groups in a regular expression.
 */
var MATCHING_GROUP_REGEXP = /\((?!\?)/g;

/**
 * Normalize the given path string,
 * returning a regular expression.
 *
 * An empty array should be passed,
 * which will contain the placeholder
 * key names. For example "/user/:id" will
 * then contain ["id"].
 *
 * @param  {String|RegExp|Array} path
 * @param  {Array} keys
 * @param  {Object} options
 * @return {RegExp}
 * @api private
 */

function pathtoRegexp(path, keys, options) {
  options = options || {};
  keys = keys || [];
  var strict = options.strict;
  var end = options.end !== false;
  var flags = options.sensitive ? '' : 'i';
  var extraOffset = 0;
  var keysOffset = keys.length;
  var i = 0;
  var name = 0;
  var m;

  if (path instanceof RegExp) {
    while (m = MATCHING_GROUP_REGEXP.exec(path.source)) {
      keys.push({
        name: name++,
        optional: false,
        offset: m.index
      });
    }

    return path;
  }

  if (Array.isArray(path)) {
    // Map array parts into regexps and return their source. We also pass
    // the same keys and options instance into every generation to get
    // consistent matching groups before we join the sources together.
    path = path.map(function (value) {
      return pathtoRegexp(value, keys, options).source;
    });

    return new RegExp('(?:' + path.join('|') + ')', flags);
  }

  path = ('^' + path + (strict ? '' : path[path.length - 1] === '/' ? '?' : '/?'))
    .replace(/\/\(/g, '/(?:')
    .replace(/([\/\.])/g, '\\$1')
    .replace(/(\\\/)?(\\\.)?:(\w+)(\(.*?\))?(\*)?(\?)?/g, function (match, slash, format, key, capture, star, optional, offset) {
      slash = slash || '';
      format = format || '';
      capture = capture || '([^\\/' + format + ']+?)';
      optional = optional || '';

      keys.push({
        name: key,
        optional: !!optional,
        offset: offset + extraOffset
      });

      var result = ''
        + (optional ? '' : slash)
        + '(?:'
        + format + (optional ? slash : '') + capture
        + (star ? '((?:[\\/' + format + '].+?)?)' : '')
        + ')'
        + optional;

      extraOffset += result.length - match.length;

      return result;
    })
    .replace(/\*/g, function (star, index) {
      var len = keys.length;

      while (len-- > keysOffset && keys[len].offset > index) {
        keys[len].offset += 3; // Replacement length minus asterisk length.
      }

      return '(.*)';
    });

  // This is a workaround for handling unnamed matching groups.
  while (m = MATCHING_GROUP_REGEXP.exec(path)) {
    var escapeCount = 0;
    var index = m.index;

    while (path.charAt(--index) === '\\') {
      escapeCount++;
    }

    // It's possible to escape the bracket.
    if (escapeCount % 2 === 1) {
      continue;
    }

    if (keysOffset + i === keys.length || keys[keysOffset + i].offset > m.index) {
      keys.splice(keysOffset + i, 0, {
        name: name++, // Unnamed matching groups must be consistently linear.
        optional: false,
        offset: m.index
      });
    }

    i++;
  }

  // If the path is non-ending, match until the end or a slash.
  path += (end ? '$' : (path[path.length - 1] === '/' ? '' : '(?=\\/|$)'));

  return new RegExp(path, flags);
}

var index$1 = createCommonjsModule(function (module) {
var pathToRegExp = index$2;

/**
 * Expose `pathToRegexp` as ES6 module
 */
module.exports = pathToRegExp;
module.exports.parse = pathToRegExp.parse;
module.exports.compile = pathToRegExp.compile;
module.exports.tokensToFunction = pathToRegExp.tokensToFunction;
module.exports.tokensToRegExp = pathToRegExp.tokensToRegExp;
module.exports['default'] = module.exports;
});

var cache = new Map();
/**
 * Returns a node containing only the matched components
 * @param routes
 * @param currentURL
 * @returns {any|VComponent}
 */
function match(routes, currentURL) {
    var location = getURLString(currentURL);
    var renderProps = matchRoutes(toArray(routes), location, '/');
    return renderProps;
}
/**
 * Go through every route and create a new node
 * with the matched components
 * @param _routes
 * @param urlToMatch
 * @param lastPath
 * @returns {any}
 */
function matchRoutes(_routes, urlToMatch, lastPath) {
    if ( urlToMatch === void 0 ) urlToMatch = '/';
    if ( lastPath === void 0 ) lastPath = '/';

    var routes = isArray(_routes) ? flatten(_routes) : toArray(_routes);
    var ref = urlToMatch.split('?');
    var pathToMatch = ref[0]; if ( pathToMatch === void 0 ) pathToMatch = '/';
    var search = ref[1]; if ( search === void 0 ) search = '';
    var params = mapSearchParams(search);
    routes.sort(pathRankSort);
    for (var i = 0; i < routes.length; i++) {
        var route = routes[i];
        var location = (lastPath + (route.props && route.props.path || '/')).replace('//', '/');
        var isLast = !route.props || isEmpty(route.props.children);
        var matchBase = matchPath(isLast, location, pathToMatch);
        if (matchBase) {
            var children = null;
            if (route.props && route.props.children) {
                var matchChild = matchRoutes(route.props.children, pathToMatch, location);
                if (matchChild) {
                    children = matchChild.matched;
                    Object.assign(params, matchChild.matched.props.params);
                }
            }
            return {
                location: location,
                matched: Inferno.cloneVNode(route, {
                    children: children,
                    params: Object.assign(params, matchBase.params),
                    component: route.props.component
                })
            };
        }
    }
}
/**
 * Converts path to a regex, if a match is found then we extract params from it
 * @param end
 * @param routePath
 * @param pathToMatch
 * @returns {any}
 */
function matchPath(end, routePath, pathToMatch) {
    var key = routePath + "|" + end;
    var regexp = cache.get(key);
    if (!regexp) {
        var keys = [];
        regexp = { pattern: index$1(routePath, keys, { end: end }), keys: keys };
        cache.set(key, regexp);
    }
    var m = regexp.pattern.exec(pathToMatch);
    if (!m) {
        return null;
    }
    var path = m[0];
    var params = Object.create(null);
    for (var i = 1; i < m.length; i += 1) {
        params[regexp.keys[i - 1].name] = decode(m[i]);
    }
    return {
        path: path === '' ? '/' : path,
        params: params
    };
}

var RouterContext = (function (Component$$1) {
    function RouterContext(props, context) {
        Component$$1.call(this, props, context);
        if (process.env.NODE_ENV !== 'production') {
            if (!props.matched && !props.location) {
                throw new TypeError('"inferno-router" requires a "location" prop passed');
            }
            if (!props.matched && !props.children) {
                throw new TypeError('"inferno-router" requires a "matched" prop passed or "Route" children defined');
            }
        }
    }

    if ( Component$$1 ) RouterContext.__proto__ = Component$$1;
    RouterContext.prototype = Object.create( Component$$1 && Component$$1.prototype );
    RouterContext.prototype.constructor = RouterContext;
    RouterContext.prototype.getChildContext = function getChildContext () {
        return {
            router: this.props.router || {
                location: {
                    pathname: this.props.location
                }
            }
        };
    };
    RouterContext.prototype.render = function render (ref) {
        var children = ref.children;
        var location = ref.location;
        var matched = ref.matched; if ( matched === void 0 ) matched = null;

        // If we're injecting a single route (ex: result from getRoutes)
        // then we don't need to go through all routes again
        if (matched) {
            return matched;
        }
        var node = match(children, location);
        return node.matched;
    };

    return RouterContext;
}(Component));

var Router = (function (Component$$1) {
    function Router(props, context) {
        Component$$1.call(this, props, context);
        if (!props.history) {
            throw new TypeError('Inferno: Error "inferno-router" requires a history prop passed');
        }
        this.router = props.history;
        var location = this.router.location.pathname + this.router.location.search;
        this.state = {
            url: props.url || (location !== 'blank' ? location : '/')
        };
    }

    if ( Component$$1 ) Router.__proto__ = Component$$1;
    Router.prototype = Object.create( Component$$1 && Component$$1.prototype );
    Router.prototype.constructor = Router;
    Router.prototype.componentWillMount = function componentWillMount () {
        var this$1 = this;

        if (this.router) {
            this.unlisten = this.router.listen(function (url) {
                this$1.routeTo(url.pathname);
            });
        }
    };
    Router.prototype.componentWillUnmount = function componentWillUnmount () {
        if (this.unlisten) {
            this.unlisten();
        }
    };
    Router.prototype.routeTo = function routeTo (url) {
        this.setState({ url: url });
    };
    Router.prototype.render = function render (ref) {
        var children = ref.children;
        var url = ref.url;

        return createElement(RouterContext, {
            location: url || this.state.url,
            router: this.router
        }, children);
    };

    return Router;
}(Component));

var index = {
	Route: Route,
	IndexRoute: IndexRoute,
	Router: Router,
	RouterContext: RouterContext,
	Link: Link,
	IndexLink: IndexLink,
	match: match
};

return index;

})));
