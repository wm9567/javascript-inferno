import { isFunction, isNull, isNullOrUndef } from 'inferno-shared';
import { ChildFlags, VNodeFlags } from 'inferno-vnode-flags';
import { VNode } from '../core/implementation';
import { handleEvent } from './events/delegation';
import { EMPTY_OBJ, findDOMfromVNode, removeChild, removeVNodeDOM } from './utils/common';

export function remove(vNode: VNode, parentDom: Element | null) {
  unmount(vNode);

  if (parentDom) {
    removeVNodeDOM(vNode, parentDom);
  }
}

export function unmount(vNode) {
  const flags = vNode.flags;

  if (flags & VNodeFlags.Element) {
    const ref = vNode.ref as any;
    const props = vNode.props;

    if (isFunction(ref)) {
      ref(null);
    }

    const children = vNode.children;
    const childFlags = vNode.childFlags;

    if (!isNull(props)) {
      for (const name in props) {
        switch (name) {
          case 'onClick':
          case 'onDblClick':
          case 'onFocusIn':
          case 'onFocusOut':
          case 'onKeyDown':
          case 'onKeyPress':
          case 'onKeyUp':
          case 'onMouseDown':
          case 'onMouseMove':
          case 'onMouseUp':
          case 'onSubmit':
          case 'onTouchEnd':
          case 'onTouchMove':
          case 'onTouchStart':
            handleEvent(name, null, vNode.dom);
            break;
          default:
            break;
        }
      }
    }

    if (childFlags & ChildFlags.MultipleChildren) {
      unmountAllChildren(children);
    } else if (childFlags === ChildFlags.HasVNodeChildren) {
      unmount(children as VNode);
    }
  } else {
    const children = vNode.children;

    // Safe guard for crashed VNode
    if (children) {
      if (flags & VNodeFlags.Component) {
        const ref = vNode.ref as any;

        if (flags & VNodeFlags.ComponentClass) {
          if (isFunction(children.componentWillUnmount)) {
            children.componentWillUnmount();
          }
          if (isFunction(ref)) {
            ref(null);
          }
          children.$UN = true;

          if (children.$LI) {
            unmount(children.$LI);
          }
        } else {
          if (!isNullOrUndef(ref) && isFunction(ref.onComponentWillUnmount)) {
            ref.onComponentWillUnmount(findDOMfromVNode(vNode), vNode.props || EMPTY_OBJ);
          }

          unmount(children);
        }
      } else if (flags & VNodeFlags.Portal) {
        remove(children as VNode, vNode.ref);
      }
    }
  }
}

export function unmountAllChildren(children: VNode[]) {
  for (let i = 0, len = children.length; i < len; i++) {
    unmount(children[i]);
  }
}

export function removeAllChildren(dom: Element, children) {
  unmountAllChildren(children);
  dom.textContent = '';
}

export function removeTextNode(dom: Element) {
  const child = dom.firstChild;

  if (child) {
    removeChild(dom, child as Element);
  }
}
