import { isArray, isInvalid, isNullOrUndef, throwError } from 'inferno-shared';
import { ChildFlags, VNodeFlags } from 'inferno-vnode-flags';

function getTagName(vNode) {
  const flags = vNode.flags;
  let tagName;

  if (flags & VNodeFlags.Element) {
    tagName = `<${vNode.type}${
      vNode.className ? ' class="' + vNode.className + '"' : ''
    }>`;
  } else if (flags & VNodeFlags.Text) {
    tagName = `Text(${vNode.children})`;
  } else if (flags & VNodeFlags.Portal) {
    tagName = `Portal*`;
  } else {
    const componentName =
      vNode.type.name || vNode.type.displayName || vNode.type.constructor.name;

    tagName = `<${componentName} />`;
  }

  return tagName;
}

function DEV_ValidateKeys(vNodeTree, vNode, forceKeyed) {
  const foundKeys = new Set();

  for (let i = 0, len = vNodeTree.length; i < len; i++) {
    const childNode = vNodeTree[i];

    if (isArray(childNode)) {
      return (
        'Encountered ARRAY in mount, array must be flattened, or normalize used. Location: ' +
        getTagName(childNode)
      );
    }

    if (isInvalid(childNode)) {
      if (forceKeyed) {
        return (
          'Encountered invalid node when preparing to keyed algorithm. Location: ' +
          getTagName(childNode)
        );
      } else if (foundKeys.size !== 0) {
        return (
          'Encountered invalid node with mixed keys. Location: ' +
          getTagName(childNode)
        );
      }
      continue;
    }
    const key = childNode.key;
    const children = childNode.children;
    const childFlags = childNode.childFlags;
    if (!isInvalid(children)) {
      let val;
      if (childFlags & ChildFlags.MultipleChildren) {
        val = DEV_ValidateKeys(children, childNode, forceKeyed);
      } else if (childFlags & ChildFlags.HasVNodeChildren) {
        val = DEV_ValidateKeys(
          [children],
          childNode,
          forceKeyed || childNode.childFlags & ChildFlags.HasKeyedChildren
        );
      }
      if (val) {
        val += ' :: ' + getTagName(childNode);

        return val;
      }
    }
    if (forceKeyed && isNullOrUndef(key)) {
      return (
        'Encountered child vNode without key during keyed algorithm. Location: ' +
        getTagName(childNode)
      );
    } else if (!forceKeyed && isNullOrUndef(key)) {
      if (foundKeys.size !== 0) {
        return (
          'Encountered children with key missing. Location: ' +
          getTagName(childNode)
        );
      }
      continue;
    }
    if (foundKeys.has(key)) {
      return (
        'Encountered two children with same key: {' +
        key +
        '}. Location: ' +
        getTagName(childNode)
      );
    }
    foundKeys.add(key);
  }
}

export function validateVNodeElementChildren(vNode) {
  if (process.env.NODE_ENV !== 'production') {
    if (vNode.childFlags & ChildFlags.HasInvalidChildren) {
      return;
    }
    if (vNode.flags & VNodeFlags.InputElement) {
      throwError("input elements can't have children.");
    }
    if (vNode.flags & VNodeFlags.TextareaElement) {
      throwError("textarea elements can't have children.");
    }
    if (vNode.flags & VNodeFlags.Element) {
      const voidTypes = [
        'area',
        'base',
        'br',
        'col',
        'command',
        'embed',
        'hr',
        'img',
        'input',
        'keygen',
        'link',
        'meta',
        'param',
        'source',
        'track',
        'wbr'
      ];
      const tag = vNode.type.toLowerCase();

      if (tag === 'media') {
        throwError("media elements can't have children.");
      }
      const idx = voidTypes.indexOf(tag);
      if (idx !== -1) {
        throwError(`${voidTypes[idx]} elements can't have children.`);
      }
    }
  }
}

export function validateKeys(vNode, forceKeyed) {
  if (process.env.NODE_ENV !== 'production') {
    let error;
    // Checks if there is any key missing or duplicate keys
    if (
      vNode.props &&
      vNode.props.children &&
      vNode.flags & VNodeFlags.Component
    ) {
      error = DEV_ValidateKeys(vNode.props.children, vNode, forceKeyed);
    } else if (vNode.children && vNode.flags & VNodeFlags.Element) {
      error = DEV_ValidateKeys(vNode.children, vNode, forceKeyed);
    }

    if (error) {
      throwError(error + ' :: ' + getTagName(vNode));
    }
  }
}
