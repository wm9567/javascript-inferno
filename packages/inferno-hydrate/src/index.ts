import { isFunction, isInvalid, isNull, isNullOrUndef, throwError, warning } from 'inferno-shared';
import { ChildFlags, VNodeFlags } from 'inferno-vnode-flags';
import { VNode, _CI, _HI, _L, _MT, _M, _MCCC, _ME, _MFCC, _MR, _MP } from 'inferno';

function isSameInnerHTML(dom: Element, innerHTML: string): boolean {
  const tempdom = document.createElement('i');

  tempdom.innerHTML = innerHTML;
  return tempdom.innerHTML === dom.innerHTML;
}

function isSamePropsInnerHTML(dom: Element, props): boolean {
  return Boolean(props && props.dangerouslySetInnerHTML && props.dangerouslySetInnerHTML.__html && isSameInnerHTML(dom, props.dangerouslySetInnerHTML.__html));
}

function hydrateComponent(vNode: VNode, parentDOM: Element, dom: Element, context, isSVG: boolean, isClass: boolean) {
  const type = vNode.type as Function;
  const ref = vNode.ref;
  const props = vNode.props || {};
  let currentNode;

  if (isClass) {
    const instance = _CI(vNode, type, props, context);
    const input = instance.$LI;

    currentNode = hydrateVNode(input, parentDOM, dom, instance.$CX, isSVG);
    _MCCC(ref, instance);
    instance.$UPD = false; // Mount finished allow going sync
  } else {
    const input = _HI(type(props, context));
    currentNode = hydrateVNode(input, parentDOM, dom, context, isSVG);
    vNode.children = input;
    _MFCC(props, ref, vNode);
  }

  return currentNode;
}

function hydrateChildren(parentVNode: VNode, parentNode, currentNode, context, isSVG) {
  const childFlags = parentVNode.childFlags;
  const children = parentVNode.children;
  const props = parentVNode.props;
  const flags = parentVNode.flags;

  if (childFlags !== ChildFlags.HasInvalidChildren) {
    let nextNode;

    if (childFlags === ChildFlags.HasVNodeChildren) {
      if (isNull(currentNode)) {
        _M(children as VNode, parentNode, context, isSVG, null);
      } else {
        nextNode = currentNode.nextSibling;
        currentNode = hydrateVNode(children as VNode, parentNode, currentNode as Element, context, isSVG);
        currentNode = currentNode ? currentNode.nextSibling : nextNode;
      }
    } else if (childFlags === ChildFlags.HasTextChildren) {
      if (isNull(currentNode)) {
        parentNode.appendChild(document.createTextNode(children as string));
      } else if (parentNode.childNodes.length !== 1 || currentNode.nodeType !== 3) {
        parentNode.textContent = children as string;
      } else {
        if (currentNode.nodeValue !== children) {
          currentNode.nodeValue = children as string;
        }
      }
      currentNode = null;
    } else if (childFlags & ChildFlags.MultipleChildren) {
      let prevVNodeIsTextNode = false;

      for (let i = 0, len = (children as VNode[]).length; i < len; i++) {
        const child = (children as VNode[])[i];

        if (isNull(currentNode) || (prevVNodeIsTextNode && (child.flags & VNodeFlags.Text) > 0)) {
          _M(child as VNode, parentNode, context, isSVG, currentNode);
        } else {
          nextNode = currentNode.nextSibling;
          currentNode = hydrateVNode(child as VNode, parentNode, currentNode as Element, context, isSVG);
          currentNode = currentNode ? currentNode.nextSibling : nextNode;
        }

        prevVNodeIsTextNode = (child.flags & VNodeFlags.Text) > 0;
      }
    }

    // clear any other DOM nodes, there should be only a single entry for the root
    if ((flags & VNodeFlags.Fragment) === 0) {
      let nextSibling: Node | null = null;

      while (currentNode) {
        nextSibling = currentNode.nextSibling;
        parentNode.removeChild(currentNode);
        currentNode = nextSibling;
      }
    }
  } else if (!isNull(parentNode.firstChild) && !isSamePropsInnerHTML(parentNode, props)) {
    parentNode.textContent = ''; // dom has content, but VNode has no children remove everything from DOM
    if (flags & VNodeFlags.FormElement) {
      // If element is form element, we need to clear defaultValue also
      (parentNode as any).defaultValue = '';
    }
  }
}

function hydrateElement(vNode: VNode, parentDOM: Element, dom: Element, context: Object, isSVG: boolean) {
  const props = vNode.props;
  const className = vNode.className;
  const flags = vNode.flags;
  const ref = vNode.ref;

  isSVG = isSVG || (flags & VNodeFlags.SvgElement) > 0;
  if (dom.nodeType !== 1 || dom.tagName.toLowerCase() !== vNode.type) {
    if (process.env.NODE_ENV !== 'production') {
      warning("Inferno hydration: Server-side markup doesn't match client-side markup or Initial render target is not empty");
    }
    _ME(vNode, null, context, isSVG, null);
    parentDOM.replaceChild(vNode.dom as Element, dom);
  } else {
    vNode.dom = dom;

    hydrateChildren(vNode, dom, dom.firstChild, context, isSVG);

    if (!isNull(props)) {
      _MP(vNode, flags, props, dom, isSVG);
    }
    if (isNullOrUndef(className)) {
      if (dom.className !== '') {
        dom.removeAttribute('class');
      }
    } else if (isSVG) {
      dom.setAttribute('class', className);
    } else {
      dom.className = className;
    }
    _MR(ref, dom);
  }

  return vNode.dom;
}

function hydrateText(vNode: VNode, parentDOM: Element, dom: Element) {
  if (dom.nodeType !== 3) {
    _MT(vNode, null, null);
    parentDOM.replaceChild(vNode.dom as Element, dom);
  } else {
    const text = vNode.children;

    if (dom.nodeValue !== text) {
      dom.nodeValue = text as string;
    }
    vNode.dom = dom;
  }

  return vNode.dom;
}

function hydrateFragment(vNode: VNode, parentDOM: Element, dom: Element, context, isSVG: boolean): Element {
  const children = vNode.children;

  if (vNode.childFlags === ChildFlags.HasVNodeChildren) {
    hydrateText(children as VNode, parentDOM, dom);
    return (vNode.dom = (children as any).dom);
  }

  hydrateChildren(vNode, parentDOM, dom, context, isSVG);
  return (vNode.dom = (children as any)[(children as any).length - 1].dom);
}

function hydrateVNode(vNode: VNode, parentDOM: Element, currentDom: Element, context: Object, isSVG: boolean): Element | null {
  const flags = (vNode.flags |= VNodeFlags.InUse);

  if (flags & VNodeFlags.Component) {
    return hydrateComponent(vNode, parentDOM, currentDom, context, isSVG, (flags & VNodeFlags.ComponentClass) > 0);
  }
  if (flags & VNodeFlags.Element) {
    return hydrateElement(vNode, parentDOM, currentDom, context, isSVG);
  }
  if (flags & VNodeFlags.Text) {
    return hydrateText(vNode, parentDOM, currentDom);
  }
  if (flags & VNodeFlags.Void) {
    return (vNode.dom = currentDom);
  }
  if (flags & VNodeFlags.Fragment) {
    return hydrateFragment(vNode, parentDOM, currentDom, context, isSVG);
  }

  if (process.env.NODE_ENV !== 'production') {
    throwError(`hydrate() expects a valid VNode, instead it received an object with the type "${typeof vNode}".`);
  }
  throwError();

  return null;
}

export function hydrate(input, parentDOM: Element, callback?: Function) {
  let dom = parentDOM.firstChild as Element;

  if (!isNull(dom)) {
    if (!isInvalid(input)) {
      dom = hydrateVNode(input, parentDOM, dom, {}, false) as Element;
    }
    // clear any other DOM nodes, there should be only a single entry for the root
    while (dom && (dom = dom.nextSibling as Element)) {
      parentDOM.removeChild(dom);
    }
  }

  if (_L.length > 0) {
    let listener;
    while ((listener = _L.shift()) !== undefined) {
      listener();
    }
  }

  (parentDOM as any).$V = input;

  if (isFunction(callback)) {
    callback();
  }
}
