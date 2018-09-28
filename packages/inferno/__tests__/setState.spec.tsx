import { Component, render, rerender } from 'inferno';
import sinon from 'sinon';

describe('setState', () => {
  let container;

  beforeEach(function() {
    container = document.createElement('div');
  });

  afterEach(function() {
    render(null, container);
    container.innerHTML = '';
  });

  it('should throw an error when setState is called in constructor', () => {
    class TestComponent extends Component<any, any> {
      constructor(props, ctx) {
        super(props, ctx);
        this.setState({
          state: 'Something'
        });
      }
    }

    expect(() => render(<TestComponent />, container)).toThrowError(Error);
  });

  it('callback should be fired after state has changed', done => {
    class TestComponent extends Component<any, {value: string}> {
      public state = {
        value: this.props.value
      };

      constructor(props) {
        super(props);
        this.checkSetState = this.checkSetState.bind(this);
      }

      public checkSetState() {
        const value = this.state.value;
        expect(value).toBe('__NEWVALUE__');
        setTimeout(function() {
          done();
        }, 100);
      }

      public componentWillReceiveProps(nextProps) {
        this.setState(
          {
            value: nextProps.value
          },
          this.checkSetState
        );
      }

      public render() {
        return null;
      }
    }

    class BaseComp extends Component<any, any> {
      public state = {
        value: '__OLDVALUE__'
      };

      public componentDidMount() {
        this.setState({
          value: '__NEWVALUE__'
        });
      }

      public render() {
        const value = this.state.value;
        return <TestComponent value={value} />;
      }
    }

    render(<BaseComp />, container);
  });

  it('Should not fail if callback is object and not function ( invalid used scenario )', () => {
    class TestComponent extends Component<{value: string}, any> {
      constructor(props) {
        super(props);
        this.state = {
          value: props.value
        };
      }

      public componentWillReceiveProps(nextProps) {
        this.setState(
          {
            value: nextProps.value
          },
          { foo: 'bar' } as any // This should not break inferno
        );
      }

      public render() {
        return null;
      }
    }

    class BaseComp extends Component<any, any> {
      public state = {
        value: '__OLDVALUE__'
      };

      public componentDidMount() {
        this.setState({
          value: '__NEWVALUE__'
        });
      }

      public render() {
        const value = this.state.value;
        return <TestComponent value={value} />;
      }
    }

    render(<BaseComp />, container);
  });

  it('Should not fail if componentDidUpdate is not defined', done => {
    class TestComponent extends Component<{value: string}, any> {
      public state = {
        value: this.props.value
      };

      constructor(props) {
        super(props);
      }

      public checkSetState() {
        const value = this.state.value;
        expect(value).toBe('__NEWVALUE__');
        setTimeout(function() {
          done();
        }, 100);
      }

      public componentWillReceiveProps(nextProps) {
        this.setState(
          {
            value: nextProps.value
          },
          this.checkSetState
        );
      }

      public render() {
        return null;
      }
    }

    class BaseComp extends Component<any, any> {
      public state = {
        value: '__OLDVALUE__'
      };

      public componentDidMount() {
        this.setState({
          value: '__NEWVALUE__'
        });
      }

      public render() {
        const value = this.state.value;
        return <TestComponent value={value} />;
      }
    }

    render(<BaseComp />, container);
  });

  // Should work as Per react: https://jsfiddle.net/f12u8xzb/
  // React does not get stuck
  it('Should not get stuck in infinite loop #1', done => {
    let doSomething;

    class Parent extends Component<any, any> {
      public state = {
        active: false,
        foo: 'b'
      };

      constructor(props, context) {
        super(props, context);

        this._setBar = this._setBar.bind(this);
        doSomething = this._setActive = this._setActive.bind(this);
      }

      private _setBar() {
        this.setState({
          foo: 'bar'
        });
      }

      private _setActive() {
        this.setState({
          active: true
        });
      }

      public render() {
        return (
          <div>
            <div>{this.state.foo}</div>
            {this.state.active ? <Child foo={this.state.foo} callback={this._setBar} /> : <Child foo={this.state.foo} callback={this._setActive} />}
          </div>
        );
      }
    }

    class Child extends Component<{foo: string, callback: () => void}> {
      constructor(props, context) {
        super(props, context);
      }

      public componentWillUpdate(nextProps) {
        if (nextProps.foo !== 'bar') {
          this.props.callback();
        }
      }

      public render() {
        return (
          <div>
            <div>{this.props.foo}</div>
          </div>
        );
      }
    }

    render(<Parent />, container);
    doSomething();

    setTimeout(function() {
      done();
    }, 45);
  });

  // Render should work as per React
  // https://jsfiddle.net/qb4ootgm/
  it('Should not fail during rendering', done => {
    let doSomething;

    class Parent extends Component<any, any> {
      public state = {
        active: false,
        foo: 'b'
      };

      constructor(props, context) {
        super(props, context);

        this._setBar = this._setBar.bind(this);
        doSomething = this._setActive = this._setActive.bind(this);
      }

      public _setBar() {
        this.setState({
          foo: 'bar'
        });
      }

      public _setActive() {
        this.setState({
          active: true
        });
      }

      public render() {
        return (
          <div>
            <div>{this.state.foo}</div>
            <Child foo={this.state.foo} callback={this._setBar} />
            <Child foo={this.state.foo} callback={this._setBar} />
            <Child foo={this.state.foo} callback={this._setBar} />
          </div>
        );
      }
    }

    class Child extends Component<{foo: string, callback: () => void}> {
      constructor(props, context) {
        super(props, context);
      }

      public componentWillReceiveProps(nextProps) {
        if (nextProps.foo !== 'bar') {
          this.setState({
            foo: 'bbaarr'
          });

          this.props.callback();
        }
      }

      public render() {
        return (
          <div>
            <div>{this.props.foo}</div>
          </div>
        );
      }
    }

    render(<Parent />, container);
    doSomething();

    setTimeout(function() {
      done();
    }, 45);
  });

  // https://jsfiddle.net/c6q9bvez/
  it('Should not fail during rendering #2', done => {
    let doSomething;

    class Parent extends Component<any, any> {
      public state = {
        active: false,
        foo: 'b'
      };

      constructor(props, context) {
        super(props, context);

        this._setBar = this._setBar.bind(this);
        doSomething = this._setActive = this._setActive.bind(this);
      }

      private _setBar() {
        this.setState({
          foo: 'bar'
        });
      }

      private  _setActive() {
        this.setState({
          active: true
        });
      }

      public render() {
        return (
          <div>
            <Child foo={this.state.foo} callback={this._setActive} />
            <ChildBar foo={this.state.foo} onComponentWillMount={this._setBar} />
            <ChildBar foo={this.state.foo} />
          </div>
        );
      }
    }

    function ChildBar({ foo }) {
      return <div>{foo}</div>;
    }

    class Child extends Component<{foo: string, callback: () => void}> {
      constructor(props, context) {
        super(props, context);
      }

      public componentWillReceiveProps(nextProps) {
        if (nextProps.foo !== 'bar') {
          this.setState({
            foo: 'bbaarr'
          });

          this.props.callback();
        }
      }

      public render() {
        return (
          <div>
            <div>{this.props.foo}</div>
          </div>
        );
      }
    }

    render(<Parent />, container);
    doSomething();

    setTimeout(function() {
      done();
    }, 45);
  });

  it('Should have new state in render when changing state during componentWillReceiveProps', done => {
    let changeFoo;

    class Parent extends Component<any, any> {
      public state = {
        foo: 'bar'
      };

      constructor(props, context) {
        super(props, context);

        changeFoo = this.changeFoo.bind(this);
      }

      public changeFoo() {
        this.setState({
          foo: 'bar2'
        });
      }

      public render() {
        return (
          <div>
            <Child foo={this.state.foo} />
          </div>
        );
      }
    }

    class Child extends Component<{foo: string}, {foo: string}> {
      public state = {
        foo: this.props.foo
      };

      constructor(props, context) {
        super(props, context);
      }

      public callback() {
        expect(container.firstChild.firstChild.innerHTML).toBe('bar2');
        done();
      }

      public componentWillReceiveProps(nextProps) {
        if (nextProps.foo !== this.state.foo) {
          this.setState(
            {
              foo: nextProps.foo
            },
            this.callback
          );
        }
      }

      public render() {
        return <div>{this.state.foo}</div>;
      }
    }

    render(<Parent />, container);

    expect(container.firstChild.firstChild.innerHTML).toBe('bar');

    changeFoo();
  });

  it('Should have new state in render when changing state during componentWillMount and render only once', () => {
    const spy = sinon.spy();

    class Parent extends Component<any, any> {
      public state = {
        foo: 'bar'
      };

      constructor(props, context) {
        super(props, context);
      }

      public render() {
        return (
          <div>
            <Child foo={this.state.foo} />
          </div>
        );
      }
    }

    let renderCount = 0;
    class Child extends Component<{foo: string}, {foo: string}> {
      public state = {
        foo: this.props.foo
      };

      constructor(props, context) {
        super(props, context);
      }

      public componentWillMount() {
        this.setState(
          {
            foo: '1'
          },
          spy
        );
        this.setState(
          {
            foo: '2'
          },
          spy
        );

        this.setState(
          {
            foo: '3'
          },
          spy
        );

        this.setState(
          {
            foo: '3'
          },
          spy
        );

        this.setState(
          {
            foo: '4'
          },
          spy
        );
      }

      public render() {
        renderCount++;
        return <div>{this.state.foo}</div>;
      }
    }

    render(<Parent />, container);

    expect(container.firstChild.firstChild.innerHTML).toBe('4');
    expect(spy.callCount).toBe(5);
    expect(renderCount).toBe(1);
  });

  // Should work as Per react: https://jsfiddle.net/f12u8xzb/
  // React does not get stuck
  it('Should not get stuck in infinite loop #1 sync', done => {
    let doSomething;

    class Parent extends Component<any, any> {
      public state = {
        active: false,
        foo: 'b'
      };

      constructor(props, context) {
        super(props, context);

        this._setBar = this._setBar.bind(this);
        doSomething = this._setActive = this._setActive.bind(this);
      }

      private _setBar() {
        this.setState({
          foo: 'bar'
        });
      }

      private _setActive() {
        this.setState({
          active: true
        });
      }

      public render() {
        return (
          <div>
            <div>{this.state.foo}</div>
            {this.state.active ? <Child foo={this.state.foo} callback={this._setBar} /> : <Child foo={this.state.foo} callback={this._setActive} />}
          </div>
        );
      }
    }

    class Child extends Component<{foo: string, callback: () => void}> {
      constructor(props, context) {
        super(props, context);
      }

      public componentWillUpdate(nextProps) {
        if (nextProps.foo !== 'bar') {
          this.props.callback();
        }
      }

      public render() {
        return (
          <div>
            <div>{this.props.foo}</div>
          </div>
        );
      }
    }

    render(<Parent />, container);
    doSomething();

    setTimeout(function() {
      done();
    }, 45);
  });

  // Render should work as per React
  // https://jsfiddle.net/qb4ootgm/
  it('Should not fail during rendering sync', done => {
    let doSomething;

    class Parent extends Component<any, any> {
      public state = {
        active: false,
        foo: 'b'
      };

      constructor(props, context) {
        super(props, context);

        this._setBar = this._setBar.bind(this);
        doSomething = this._setActive = this._setActive.bind(this);
      }

      private _setBar() {
        this.setState({
          foo: 'bar'
        });
      }

      private _setActive() {
        this.setState({
          active: true
        });
      }

      public render() {
        return (
          <div>
            <div>{this.state.foo}</div>
            <Child foo={this.state.foo} callback={this._setBar} />
            <Child foo={this.state.foo} callback={this._setBar} />
            <Child foo={this.state.foo} callback={this._setBar} />
          </div>
        );
      }
    }

    class Child extends Component<{foo: string, callback: () => void}> {
      constructor(props, context) {
        super(props, context);
      }

      public componentWillReceiveProps(nextProps) {
        if (nextProps.foo !== 'bar') {
          this.setState({
            foo: 'bbaarr'
          });

          this.props.callback();
        }
      }

      public render() {
        return (
          <div>
            <div>{this.props.foo}</div>
          </div>
        );
      }
    }

    render(<Parent />, container);
    doSomething();

    setTimeout(function() {
      done();
    }, 45);
  });

  it('Should be possible to update state in componentWillUpdate', () => {
    interface MyState {
      foo: string
    }

    class Hello extends Component<any, MyState> {
      constructor(p, c) {
        super(p, c);

        this.state = {
          foo: 'je'
        };
      }
      public componentWillUpdate() {
        if (this.state!.foo === 'je') {
          this.setState({
            foo: 'bar'
          })
        }
      }
      public render() {
        return <div>Hello {this.state!.foo}</div>;
      }
    }

    expect(container.innerHTML).toBe('');

    render(
      <Hello name="World" />,
      container
    );

    expect(container.innerHTML).toBe('<div>Hello je</div>');

    render(
      <Hello name="World" />,
      container
    );

    rerender();

    expect(container.innerHTML).toBe('<div>Hello bar</div>');
  });

  it('setState must be sync like React if no state changes are pending', () => {
    let doSomething;

    class Parent extends Component<any, any> {
      public state = {
        foo: 'b'
      };

      constructor(props, context) {
        super(props, context);

        doSomething = this._setBar = this._setBar.bind(this);
      }

      private _setBar(p) {
        this.setState({
          foo: p
        });
      }

      public render() {
        return <div>{this.state.foo}</div>;
      }
    }

    render(<Parent />, container);
    // Set state must go sync when nothing pending
    expect(container.firstChild.innerHTML).toBe('b');
    doSomething('1');
    expect(container.firstChild.innerHTML).toBe('1');
    doSomething('2');
    expect(container.firstChild.innerHTML).toBe('2');
    doSomething('3');
    expect(container.firstChild.innerHTML).toBe('3');
    doSomething('4');
    expect(container.firstChild.innerHTML).toBe('4');
  });

  it('Set state callback should have context of caller component (forced) - as per React', () => {
    let cnt = 0;

    class Com extends Component<any, any> {
      public doTest() {
        expect(this.state.a).toBe(cnt);
      }

      public componentWillMount() {
        this.setState(
          {
            a: ++cnt
          },
          this.doTest
        );
      }

      public componentDidMount() {
        this.setState(
          {
            a: ++cnt
          },
          this.doTest
        );
      }

      public render() {
        return <div>1</div>;
      }
    }

    render(<Com />, container);
  });

  it('Should not re-create state if no setState is called', () => {
    const FooBarState = [1];

    class FooBar extends Component<any, any> {
      constructor(props, context) {
        super(props, context);

        this.state = FooBarState;
      }

      public render(_props, state) {
        expect(state).toBe(FooBarState);
        expect(this.state).toBe(FooBarState);
        expect(state === FooBarState).toBe(true);

        return <div>{state[0]}</div>;
      }
    }

    render(<FooBar />, container);

    expect(container.innerHTML).toEqual('<div>1</div>');

    render(<FooBar />, container);

    expect(container.innerHTML).toEqual('<div>1</div>');
  });

  it('Should keep context in sync with state #1182', () => {
    function Child(_props, context) {
      return <div>{(context.active ? 'ACTIVE' : 'INACTIVE') + '   :   ' + (context.state.active ? 'ACTIVE' : 'INACTIVE')}</div>;
    }

    class Container extends Component<{active: boolean}, {active: boolean}> {
      public state = {
        active: false
      };

      constructor(props, context) {
        super(props, context);
      }

      public getChildContext() {
        return {
          active: this.state.active,
          state: this.state
        };
      }

      public componentWillReceiveProps(nextProps) {
        if (this.state.active !== nextProps.active) {
          this.setState({
            active: nextProps.active
          });
        }
      }

      public render() {
        return <Child />;
      }
    }

    let updater;
    class App extends Component<any, any> {
      public state = {
        active: false
      };

      constructor(props, context) {
        super(props, context);

        updater = this.didClick.bind(this);
      }

      public didClick() {
        this.setState({
          active: !this.state.active
        });
      }

      public render() {
        return (
          <div>
            <Container active={this.state.active} />
          </div>
        );
      }
    }

    render(<App />, container);

    expect(container.textContent).toBe('INACTIVE   :   INACTIVE');

    updater();

    expect(container.textContent).toBe('ACTIVE   :   ACTIVE');

    updater();

    expect(container.textContent).toBe('INACTIVE   :   INACTIVE');

    updater();

    expect(container.textContent).toBe('ACTIVE   :   ACTIVE');
  });
});
