/**
 * @module Inferno
 */ /** TypeDoc Comment */

import { ChildFlags, VNodeFlags } from 'inferno-vnode-flags';
import {
  isArray,
  isFunction,
  isInvalid,
  isNull,
  isNullOrUndef,
  isNumber,
  isString,
  isStringOrNumber,
  isUndefined,
  throwError
} from 'inferno-shared';
import { EMPTY_OBJ } from '../DOM/utils/common';
import { validateVNodeElementChildren } from "./validate";

const keyPrefix = '$';

export interface VNode {
  children: InfernoChildren;
  childFlags: ChildFlags;
  dom: Element | null;
  className: string | null;
  flags: VNodeFlags;
  key: any;
  parentVNode: VNode | null;
  props: Props | null;
  ref: Ref | Refs | null;
  type: any;
}
export type InfernoInput = VNode | null | string | number;
export type Ref = (node?: Element | null) => void;
export type InfernoChildren =
  | string
  | number
  | boolean
  | undefined
  | VNode
  | Array<string | number | VNode>
  | null;

export interface Props {
  children?: InfernoChildren;
  ref?: Ref | null;
  key?: any;
  className?: string;
  [k: string]: any;
}

export interface Refs {
  onComponentDidMount?: (domNode: Element) => void;
  onComponentWillMount?(): void;
  onComponentShouldUpdate?(lastProps, nextProps): boolean;
  onComponentWillUpdate?(lastProps, nextProps): void;
  onComponentDidUpdate?(lastProps, nextProps): void;
  onComponentWillUnmount?(domNode: Element): void;
}

function getVNode(
  childFlags,
  children,
  className,
  flags,
  key,
  props,
  ref,
  type
): VNode {
  return {
    childFlags,
    children,
    className,
    dom: null,
    flags,
    key: key === void 0 ? null : key,
    parentVNode: null,
    props: props === void 0 ? null : props,
    ref: ref === void 0 ? null : ref,
    type
  };
}

export function createVNode(
  flags: VNodeFlags,
  type,
  className?: string | null,
  children?: InfernoChildren,
  childFlags?: ChildFlags,
  props?: Props | null,
  key?: any,
  ref?: Ref | Refs | null
): VNode {
  if (process.env.NODE_ENV !== 'production') {
    if (flags & VNodeFlags.Component) {
      throwError(
        'Creating Component vNodes using createVNode is not allowed. Use Inferno.createComponentVNode method.'
      );
    }
  }
  const vNode = getVNode(
    childFlags === void 0 ? ChildFlags.HasInvalidChildren : childFlags,
    children,
    className,
    flags,
    key,
    props,
    ref,
    type
  );

  if (process.env.NODE_ENV !== 'production') {
    validateVNodeElementChildren(vNode);
  }

  const optsVNode = options.createVNode;

  if (isFunction(optsVNode)) {
    optsVNode(vNode);
  }

  return vNode;
}

export function createComponentVNode(
  flags: VNodeFlags,
  type,
  props?: Props | null,
  key?: any,
  ref?: Ref | Refs | null
) {
  if (process.env.NODE_ENV !== 'production') {
    if (flags & VNodeFlags.HtmlElement) {
      throwError(
        'Creating element vNodes using createComponentVNode is not allowed. Use Inferno.createVNode method.'
      );
    }
  }

  if ((flags & VNodeFlags.ComponentUnknown) > 0) {
    flags =
      !isUndefined(type.prototype) && isFunction(type.prototype.render)
        ? VNodeFlags.ComponentClass
        : VNodeFlags.ComponentFunction;
  }

  // set default props
  const defaultProps = (type as any).defaultProps;

  if (!isNullOrUndef(defaultProps)) {
    if (!props) {
      props = {}; // Props can be referenced and modified at application level so always create new object
    }
    for (const prop in defaultProps) {
      if (isUndefined(props[prop])) {
        props[prop] = defaultProps[prop];
      }
    }
  }

  if ((flags & VNodeFlags.ComponentFunction) > 0) {
    const defaultHooks = (type as any).defaultHooks;

    if (!isNullOrUndef(defaultHooks)) {
      if (!ref) {
        // As ref cannot be referenced from application level, we can use the same refs object
        ref = defaultHooks;
      } else {
        for (const prop in defaultHooks) {
          if (isUndefined(ref[prop])) {
            ref[prop] = defaultHooks[prop];
          }
        }
      }
    }
  }

  const vNode = getVNode(
    ChildFlags.HasInvalidChildren,
    null,
    null,
    flags,
    key,
    props,
    ref,
    type
  );
  const optsVNode = options.createVNode;

  if (isFunction(optsVNode)) {
    optsVNode(vNode);
  }

  return vNode;
}

export function createTextVNode(text, key?) {
  return getVNode(
    ChildFlags.HasInvalidChildren,
    isNullOrUndef(text) ? '' : text,
    null,
    VNodeFlags.Text,
    key,
    null,
    null,
    0
  );
}

export function normalizeProps(vNode) {
  const props = vNode.props;

  if (props) {
    if (vNode.flags & VNodeFlags.Element) {
      if (!isUndefined(props.children) && isNullOrUndef(vNode.children)) {
        normalizeChildren(vNode, props.children);
      }
      if (!isUndefined(props.className)) {
        vNode.className = props.className || null;
        props.className = undefined;
      }
    }
    if (!isUndefined(props.key)) {
      vNode.key = props.key;
      props.key = undefined;
    }
    if (!isUndefined(props.ref)) {
      vNode.ref = props.ref as any;
      props.ref = undefined;
    }
  }

  return vNode;
}

export function directClone(vNodeToClone: VNode): VNode {
  let newVNode;
  const flags = vNodeToClone.flags;

  if (flags & VNodeFlags.Component) {
    let props;
    const propsToClone = vNodeToClone.props;

    if (isNull(propsToClone)) {
      props = EMPTY_OBJ;
    } else {
      props = {};
      for (const key in propsToClone) {
        props[key] = propsToClone[key];
      }
    }
    newVNode = createComponentVNode(
      flags,
      vNodeToClone.type,
      props,
      vNodeToClone.key,
      vNodeToClone.ref
    );
    const newProps = newVNode.props;

    const newChildren = newProps.children;
    // we need to also clone component children that are in props
    // as the children may also have been hoisted
    if (newChildren) {
      if (isArray(newChildren)) {
        const len = newChildren.length;
        if (len > 0) {
          const tmpArray: any[] = [];

          for (let i = 0; i < len; i++) {
            const child = newChildren[i];

            if (isStringOrNumber(child)) {
              tmpArray.push(child);
            } else if (!isInvalid(child) && isVNode(child)) {
              tmpArray.push(directClone(child));
            }
          }
          newProps.children = tmpArray;
        }
      } else if (isVNode(newChildren)) {
        newProps.children = directClone(newChildren);
      }
    }

    newVNode.children = null;
  } else if (flags & VNodeFlags.Element) {
    const children = vNodeToClone.children;

    newVNode = normalizeChildren(
      createVNode(
        flags,
        vNodeToClone.type,
        vNodeToClone.className,
        null,
        0,
        vNodeToClone.props,
        vNodeToClone.key,
        vNodeToClone.ref
      ),
      children
    );
  } else if (flags & VNodeFlags.Text) {
    newVNode = createTextVNode(
      vNodeToClone.children as string,
      vNodeToClone.key
    );
  } else if (flags & VNodeFlags.Portal) {
    newVNode = vNodeToClone;
  }

  return newVNode;
}

export function createVoidVNode(): VNode {
  return createVNode(VNodeFlags.Void, null, null, '', 0, null, null, null);
}

export function isVNode(o: VNode): boolean {
  return isNumber(o.flags);
}

function applyKey(key: string, vNode: VNode) {
  vNode.key = key;

  return vNode;
}

function applyKeyIfMissing(key: string | number, vNode: VNode): VNode {
  if (isNull(vNode.key) || vNode.key[0] === keyPrefix) {
    return applyKey(isNumber(key) ? `$${key}` : (key as string), vNode);
  }
  return vNode;
}

function applyKeyPrefix(key: string, vNode: VNode): VNode {
  vNode.key = key + vNode.key;

  return vNode;
}

export function _normalizeVNodes(
  nodes: any[],
  result: VNode[],
  index: number,
  currentKey: string
) {
  for (const len = nodes.length; index < len; index++) {
    let n = nodes[index];

    if (!isInvalid(n)) {
      const newKey = `${currentKey}$${index}`;

      if (isArray(n)) {
        _normalizeVNodes(n, result, 0, newKey);
      } else {
        if (isStringOrNumber(n)) {
          n = createTextVNode(n, null);
        } else if (!isNull(n.dom) || (n.key && n.key[0] === keyPrefix)) {
          n = directClone(n);
        }
        if (isNull(n.key) || n.key[0] === keyPrefix) {
          n = applyKey(newKey, n as VNode);
        } else {
          n = applyKeyPrefix(currentKey, n as VNode);
        }

        result.push(n);
      }
    }
  }
}

export function getFlagsForElementVnode(type: string): VNodeFlags {
  if (type === 'svg') {
    return VNodeFlags.SvgElement;
  }
  if (type === 'input') {
    return VNodeFlags.InputElement;
  }
  if (type === 'select') {
    return VNodeFlags.SelectElement;
  }
  if (type === 'textarea') {
    return VNodeFlags.TextareaElement;
  }

  return VNodeFlags.HtmlElement;
}

export function normalizeChildren(vNode, children) {
  let newChildren: any;
  let newChildFlags: number;

  // Don't change children to match strict equal (===) true in patching
  if (isInvalid(children)) {
    newChildFlags = ChildFlags.HasInvalidChildren;
    newChildren = children;
  } else if (isString(children)) {
    newChildFlags = ChildFlags.HasVNodeChildren;
    newChildren = createTextVNode(children);
  } else if (isNumber(children)) {
    newChildFlags = ChildFlags.HasVNodeChildren;
    newChildren = createTextVNode(children + '');
  } else if (isArray(children)) {
    const len = children.length;

    if (len === 0) {
      newChildren = null;
      newChildFlags = ChildFlags.HasInvalidChildren;
    } else {
      // we assign $ which basically means we've flagged this array for future note
      // if it comes back again, we need to clone it, as people are using it
      // in an immutable way
      // tslint:disable-next-line
      if (Object.isFrozen(children) || children['$'] === true) {
        children = children.slice();
      }

      newChildFlags = ChildFlags.HasKeyedChildren;

      for (let i = 0; i < len; i++) {
        const n = children[i];

        if (isInvalid(n) || isArray(n)) {
          newChildren = newChildren || children.slice(0, i);

          _normalizeVNodes(children, newChildren, i, '');
          break;
        } else if (isStringOrNumber(n)) {
          newChildren = newChildren || children.slice(0, i);
          newChildren.push(applyKeyIfMissing(i, createTextVNode(n, null)));
        } else {
          const key = n.key;
          const isNullDom = isNull(n.dom);
          const isNullKey = isNull(key);
          const isPrefixed = !isNullKey && key[0] === keyPrefix;

          if (!isNullDom || isNullKey || isPrefixed) {
            newChildren = newChildren || children.slice(0, i);
            newChildren.push(applyKeyIfMissing(i, isNullDom && !isPrefixed ? n : directClone(n)));
          } else if (newChildren) {
            newChildren.push(applyKeyIfMissing(i, n));
          }
        }
      }
      newChildren = newChildren || children;
      newChildren.$ = true;
    }
  } else {
    newChildren = children;

    if (!isNull((children as VNode).dom)) {
      newChildren = directClone(children as VNode);
    }
    newChildFlags = ChildFlags.HasVNodeChildren;
  }

  vNode.children = newChildren;
  vNode.childFlags = newChildFlags;

  if (process.env.NODE_ENV !== 'production') {
    validateVNodeElementChildren(vNode);
  }

  return vNode;
}

export const options: {
  afterMount: null | Function;
  afterRender: null | Function;
  afterUpdate: null | Function;
  beforeRender: null | Function;
  beforeUnmount: null | Function;
  createVNode: null | Function;
  findDOMNodeEnabled: boolean;
  roots: Map<any, any>;
} = {
  afterMount: null,
  afterRender: null,
  afterUpdate: null,
  beforeRender: null,
  beforeUnmount: null,
  createVNode: null,
  findDOMNodeEnabled: false,
  roots: new Map<any, any>()
};
