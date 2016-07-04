import Lifecycle from './lifecycle';
import { mount } from './mounting';
import { patch } from './patching';
import { getActiveNode, resetActiveNode, isVPlaceholder } from './utils';
import { isUndefined, isInvalidNode, isNull } from '../core/utils';
import hydrate from './hydration';
import { createVPlaceholder } from '../core/shapes';

const roots = new Map();
export const componentToDOMNodeMap = new Map();

export function findDOMNode(domNode) {
	return componentToDOMNodeMap.get(domNode) || null;
}

export function render(input, parentDom) {
	const root = roots.get(parentDom);
	const lifecycle = new Lifecycle();

	if (isUndefined(root)) {
		if (!isInvalidNode(input)) {
			let skipMount = true;

			if (!hydrate(input, parentDom, lifecycle)) {
				mount(input, parentDom, lifecycle, {}, null, false);
			}
			lifecycle.trigger();
			roots.set(parentDom, { input: input });
		}
	} else {
		const activeNode = getActiveNode();

		patch(root.input, input, parentDom, lifecycle, {}, null, null, false);
		lifecycle.trigger();
		if (isNull(input)) {
			roots.delete(parentDom);
		}
		root.input = input;
		resetActiveNode(activeNode);
	}
}
