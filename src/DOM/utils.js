import { mount } from './mounting';
import { isArray, isNullOrUndefined, isInvalidNode, isStringOrNumber, replaceInArray } from './../core/utils';
import { recyclingEnabled, pool } from './recycling';
import { componentToDOMNodeMap } from './rendering';
import { createVText, createVPlaceholder, createVList } from '../core/shapes';

function constructDefaults(string, object, value) {
	/* eslint no-return-assign: 0 */
	string.split(',').forEach(i => object[i] = value);
}

const xlinkNS = 'http://www.w3.org/1999/xlink';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
export const strictProps = {};
export const booleanProps = {};
export const namespaces = {};
export const isUnitlessNumber = {};

constructDefaults('xlink:href,xlink:arcrole,xlink:actuate,xlink:role,xlink:titlef,xlink:type', namespaces, xlinkNS);
constructDefaults('xml:base,xml:lang,xml:space', namespaces, xmlNS);
constructDefaults('volume,value', strictProps, true);
constructDefaults('muted,scoped,loop,open,checked,default,capture,disabled,selected,readonly,multiple,required,autoplay,controls,seamless,reversed,allowfullscreen,novalidate', booleanProps, true);
constructDefaults('animationIterationCount,borderImageOutset,borderImageSlice,borderImageWidth,boxFlex,boxFlexGroup,boxOrdinalGroup,columnCount,flex,flexGrow,flexPositive,flexShrink,flexNegative,flexOrder,gridRow,gridColumn,fontWeight,lineClamp,lineHeight,opacity,order,orphans,tabSize,widows,zIndex,zoom,fillOpacity,floodOpacity,stopOpacity,strokeDasharray,strokeDashoffset,strokeMiterlimit,strokeOpacity,strokeWidth,', isUnitlessNumber, true);

export function isVText(o) {
	return o.text !== undefined;
}

export function isVPlaceholder(o) {
	return o.placeholder === true;
}

export function isVList(o) {
	return o.items !== undefined;
}

export function insertOrAppend(parentDom, newNode, nextNode) {
	if (isNullOrUndefined(nextNode)) {
		parentDom.appendChild(newNode);
	} else {
		parentDom.insertBefore(newNode, nextNode);
	}
}

export function replaceVListWithNode(parentDom, vList, dom) {
	const items = vList.items;
	const pointer = vList.pointer;
	const itemsLength = items.length;

	if (itemsLength > 0) {
		for (let i = 0; i < itemsLength; i++) {
			const item = items[i];

			if (isVList(item)) {
				debugger;
			} else {
				removeChild(parentDom, item.dom);
			}
		}
	}
	replaceNode(parentDom, dom, pointer);
}

export function documentCreateElement(tag, isSVG) {
	let dom;

	if (isSVG === true) {
		dom = document.createElementNS('http://www.w3.org/2000/svg', tag);
	} else {
		dom = document.createElement(tag);
	}
	return dom;
}

export function appendText(text, parentDom, singleChild) {
	if (parentDom === null) {
		return document.createTextNode(text);
	} else {
		if (singleChild) {
			if (text !== '') {
				parentDom.textContent = text;
				return parentDom.firstChild;
			} else {
				const textNode = document.createTextNode('');

				parentDom.appendChild(textNode);
				return textNode;
			}
		} else {
			const textNode = document.createTextNode(text);

			parentDom.appendChild(textNode);
			return textNode;
		}
	}
}

export function replaceWithNewNode(lastNode, nextNode, parentDom, lifecycle, context, instance, isSVG) {
	let lastInstance = null;
	const instanceLastNode = lastNode._lastNode;

	if (!isNullOrUndefined(instanceLastNode)) {
		lastInstance = lastNode;
		lastNode = instanceLastNode;
	}
	detachNode(lastNode);
	const dom = mount(nextNode, null, lifecycle, context, instance, isSVG);

	nextNode.dom = dom;
	replaceNode(parentDom, dom, lastNode.dom);
	if (lastInstance !== null) {
		lastInstance._lastNode = nextNode;
	}
}

export function replaceNode(parentDom, nextDom, lastDom) {
	parentDom.replaceChild(nextDom, lastDom);
}

export function detachNode(node, shallow) {
	if (isInvalidNode(node) || isStringOrNumber(node)) {
		return;
	}
	const instance = node.instance;
	let instanceHooks = null;
	let instanceChildren = null;

	if (!isNullOrUndefined(instance)) {
		instanceHooks = instance.hooks;
		instanceChildren = instance.children;

		if (instance.render !== undefined) {
			instance.componentWillUnmount();
			instance._unmounted = true;
			componentToDOMNodeMap.delete(instance);
			!shallow && detachNode(instance._lastNode);
		}
	}
	const hooks = node.hooks || instanceHooks;

	if (!isNullOrUndefined(hooks)) {
		if (!isNullOrUndefined(hooks.willDetach)) {
			hooks.willDetach(node.dom);
		}
		if (!isNullOrUndefined(hooks.componentWillUnmount)) {
			hooks.componentWillUnmount(node.dom, hooks);
		}
	}
	const children = node.children || instanceChildren;

	if (isNullOrUndefined(instance) && !isNullOrUndefined(children)) {
		if (isArray(children)) {
			for (let i = 0; i < children.length; i++) {
				detachNode(children[i]);
			}
		} else {
			detachNode(children);
		}
	}
}

export function normaliseChild(children, i) {
	let child = children[i];

	if (isStringOrNumber(child)) {
		child = children[i] = createVText(child);
	}
	if (isInvalidNode(child)) {
		child = children[i] = createVPlaceholder();
	}
	if (isArray(child)) {
		child = children[i] = createVList(child);
	}
	return child;
}

export function remove(node, parentDom) {
	const dom = node.dom;
	if (dom === parentDom) {
		dom.innerHTML = '';
	} else {
		parentDom.removeChild(dom);
		if (recyclingEnabled) {
			pool(node);
		}
	}
	detachNode(node);
}

export function removeChild(parentDom, dom) {
	parentDom.removeChild(dom);
}

export function removeEvents(events, lastEventKeys, dom) {
	const eventKeys = lastEventKeys || Object.keys(events);

	for (let i = 0; i < eventKeys.length; i++) {
		const event = eventKeys[i];

		dom[event] = null;
	}
}

function insertChildren(parentNode, childNodes, dom) {
	// we need to append all childNodes now
	for (let i = 0; i < childNodes.length; i++) {
		parentNode.insertBefore(childNodes[i], dom);
	}
}

// TODO: for node we need to check if document is valid
export function getActiveNode() {
	return document.activeElement;
}

export function removeAllChildren(dom, children) {
	if (recyclingEnabled) {
		const childrenLength = children.length;

		if (childrenLength > 5) {
			for (let i = 0; i < childrenLength; i++) {
				const child = children[i];

				if (!isInvalidNode(child)) {
					pool(child);
				}
			}
		}
	}
	dom.textContent = '';
}

export function resetActiveNode(activeNode) {
	if (activeNode !== null && activeNode !== document.body && document.activeElement !== activeNode) {
		activeNode.focus(); // TODO: verify are we doing new focus event, if user has focus listener this might trigger it
	}
}

export function isKeyed(lastChildren, nextChildren) {
	return nextChildren.length && !isNullOrUndefined(nextChildren[0]) && !isNullOrUndefined(nextChildren[0].key)
		|| lastChildren.length && !isNullOrUndefined(lastChildren[0]) && !isNullOrUndefined(lastChildren[0].key);
}

function selectOptionValueIfNeeded(vdom, values) {
	if (vdom.tag !== 'option') {
		for (let i = 0, len = vdom.children.length; i < len; i++) {
			selectOptionValueIfNeeded(vdom.children[i], values);
		}
		// NOTE! Has to be a return here to catch optGroup elements
		return;
	}

	const value = vdom.attrs && vdom.attrs.value;

	if (values[value]) {
		vdom.attrs = vdom.attrs || {};
		vdom.attrs.selected = 'selected';
		vdom.dom.selected = true;
	} else {
		vdom.dom.selected = false;
	}
}

export function selectValue(vdom) {
	let value = vdom.attrs && vdom.attrs.value;

	let values = {};
	if (isArray(value)) {
		for (let i = 0, len = value.length; i < len; i++) {
			values[value[i]] = value[i];
		}
	} else {
		values[value] = value;
	}
	for (let i = 0, len = vdom.children.length; i < len; i++) {
		selectOptionValueIfNeeded(vdom.children[i], values);
	}

	if (vdom.attrs && vdom.attrs[value]) {
		delete vdom.attrs.value; // TODO! Avoid deletion here. Set to null or undef. Not sure what you want to usev
	}
}

export function handleAttachedHooks(hooks, lifecycle, dom) {
	if (!isNullOrUndefined(hooks.created)) {
		hooks.created(dom);
	}
	if (!isNullOrUndefined(hooks.attached)) {
		lifecycle.addListener(() => {
			hooks.attached(dom);
		});
	}
}
