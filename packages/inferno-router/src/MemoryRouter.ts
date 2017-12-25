/**
 * @module Inferno-Router
 */ /** TypeDoc Comment */

import { createVNode, VNode, Component } from 'inferno';
import { VNodeFlags, ChildFlags } from 'inferno-vnode-flags';
import { createMemoryHistory } from 'history';
import { Router } from './Router';
import { warning } from './utils';

export interface IMemoryRouterProps {
  initialEntries?: string[];
  initialIndex?: number;
  getUserConfirmation?: () => {};
  keyLength?: number;
  children: Array<Component<any, any>>;
}

export class MemoryRouter extends Component<IMemoryRouterProps, any> {
  public history;

  constructor(props?: any, context?: any) {
    super(props, context);
    this.history = createMemoryHistory(props);
  }

  public render(): VNode {
    return createVNode(
      VNodeFlags.ComponentClass,
      Router,
      null,
      null,
      ChildFlags.HasInvalidChildren,
      {
        children: this.props.children,
        history: this.history
      }
    );
  }
}

if (process.env.NODE_ENV !== 'production') {
  MemoryRouter.prototype.componentWillMount = function() {
    warning(
      !this.props.history,
      '<MemoryRouter> ignores the history prop. To use a custom history, ' +
        'use `import { Router }` instead of `import { MemoryRouter as Router }`.'
    );
  };
}
