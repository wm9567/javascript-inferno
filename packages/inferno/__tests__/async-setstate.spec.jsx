import { Component, render } from 'inferno';
import {spy} from 'sinon';

describe('Async set state issue', () => {
  let container;

  beforeEach(function() {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(function() {
    render(null, container);
    container.innerHTML = '';
    document.body.removeChild(container);
  });

  it('Should always call all set change callbacks', (done) => {
    class HoC extends Component {
      constructor(props) {
        super(props);

        this.update = this.update.bind(this);
      }

      update() {
        this.setState({});
      }

      render(props) {
        return (
          <div>
            <Test update={this.update} run={props.run} name="first"/>
            <Test update={this.update} run={props.run} name="second"/>
          </div>
        );
      }
    }

    let _fromCWRPCBRequested = 0,
      _failureCreatorCBRequested = 0,
      _callMePlsCBRequested = 0,
      _justBecauseCBRequested = 0,
      _fromCWRPCalled = 0,
      _failureCreatorCalled = 0,
      _callMePlsCalled = 0,
      _justBecauseCalled = 0;

    class Test extends Component {
      constructor(props) {
        super(props);

        this.state = {
          success: 0,
          counter: 0,
          async: false,
          failure: false
        };
      }

      _forceASYNC() {
        // hack just for testing, this forces parent is updating so we can test async setState flow
        if (this.state.counter === 1) {
          this.props.update();
        }
      }

      _justBecause() {
        _justBecauseCalled++;
        this._forceASYNC();

        this.setState({
          success: 2
        });
      }

      _callMePls() {
        _callMePlsCalled++;
        this._forceASYNC();

        _justBecauseCBRequested++;
        this.setState({
          success: 1
        }, this._justBecause);
      }

      _failureCreator() {
        _failureCreatorCalled++;
        this._forceASYNC();

        _callMePlsCBRequested++;
        this.setState({
          failure: true
        }, this._callMePls);
      }

      _fromCWRP() {
        _fromCWRPCalled++;
        this._forceASYNC();

        _failureCreatorCBRequested++;
        // This setState triggers async flow
        this.setState({
          async: true
        }, this._failureCreator);
      }

      componentWillReceiveProps(nextProps, nextContext) {
        _fromCWRPCBRequested++;

        this.setState({
          counter: this.state.counter + 1
        }, this._fromCWRP);
      }

      render() {
        return (
          <div>
            {`${this.props.name} ${this.state.success} ${this.state.counter} ${this.state.async} ${this.state.failure}`}
          </div>
        );
      }
    }

    render(<HoC run={1} />, container);
    render(<HoC run={2} />, container);
    setTimeout(function () {
      // Set state should be called as many times as it was requested
      expect(_fromCWRPCBRequested).toBe(_fromCWRPCalled);
      expect(_callMePlsCBRequested).toBe(_callMePlsCalled);
      expect(_failureCreatorCBRequested).toBe(_failureCreatorCalled);
      expect(_justBecauseCBRequested).toBe(_justBecauseCalled);

      // This assertion is just to document it used to be 4 iterations
      expect(_fromCWRPCBRequested).toBe(4);
      expect(_callMePlsCBRequested).toBe(4);
      expect(_failureCreatorCBRequested).toBe(4);
      expect(_justBecauseCBRequested).toBe(4);

      expect(container.innerHTML).toBe('<div><div>first 2 2 true true</div><div>second 2 2 true true</div></div>');

      done();
    }, 20);
  });

  it('Should always call all set change callbacks in order of setState requests', (done) => {
    class HoC extends Component {
      constructor(props) {
        super(props);

        this.update = this.update.bind(this);
      }

      update() {
        this.setState({});
      }

      render(props) {
        return (
          <div>
            <TestBefore update={this.update} run={props.run}/>
            <TestAfter update={this.update} run={props.run}/>
          </div>
        );
      }
    }

    let testBeforeBeforeSpy,
      testBeforeAfterSpy,
      testAfterBeforeSpy,
      testAfterAfterSpy;

    class TestBefore extends Component {
      constructor(props) {
        super(props);

        this.state = {
          async: 0
        };

        testBeforeBeforeSpy = spy(this, '_before');
        testBeforeAfterSpy = spy(this, '_after');
      }

      _forceASYNC() {
        // hack just for testing, this forces parent is updating so we can test async setState flow
        if (this.state.counter === 1) {
          this.props.update();
        }
      }

      _before() {}

      _after() {}

      _fromCWRP() {
        this._forceASYNC();

        this.setState({
          async: 1
        }, this._before);

        this.setState({
          async: 2
        }, this._after);
      }

      componentWillReceiveProps(nextProps, nextContext) {
        this.setState({
          counter: this.state.counter + 1
        }, this._fromCWRP);
      }

      render() {
        return (
          <div>
            {`${this.state.async}`}
          </div>
        );
      }
    }

    class TestAfter extends Component {
      constructor(props) {
        super(props);

        this.state = {
          async: 0
        };

        testAfterBeforeSpy = spy(this, '_before');
        testAfterAfterSpy = spy(this, '_after');
      }

      _forceASYNC() {
        // hack just for testing, this forces parent is updating so we can test async setState flow
        if (this.state.counter === 1) {
          this.props.update();
        }
      }

      _before() {}

      _after() {}

      _fromCWRP() {
        this._forceASYNC();

        this.setState({
          async: 1
        }, this._before);

        this.setState({
          async: 2
        }, this._after);
      }

      componentWillReceiveProps(nextProps, nextContext) {
        this.setState({
          counter: this.state.counter + 1
        }, this._fromCWRP);
      }

      render() {
        return (
          <div>
            {`${this.state.async}`}
          </div>
        );
      }
    }

    render(<HoC run={1} />, container);
    render(<HoC run={2} />, container);

    setTimeout(function () {
      // Set state should be called as many times as it was requested
      expect(testBeforeBeforeSpy.calledOnce).toBe(true);
      expect(testBeforeAfterSpy.calledOnce).toBe(true);
      expect(testAfterBeforeSpy.calledOnce).toBe(true);
      expect(testAfterAfterSpy.calledOnce).toBe(true);

      expect(testBeforeBeforeSpy.calledBefore(testBeforeAfterSpy)).toBe(true);
      expect(testBeforeAfterSpy.calledBefore(testAfterBeforeSpy)).toBe(true);
      expect(testAfterBeforeSpy.calledBefore(testAfterAfterSpy)).toBe(true);

      expect(container.innerHTML).toBe('<div><div>2</div><div>2</div></div>');

      done();
    }, 20);
  });

  it('Should not call applystate for components which were unmounted during the micro task startup', function (done) {
    class HoC extends Component {
      constructor(props) {
        super(props);

        this.update = this.update.bind(this);
      }

      update() {
        this.setState({});
      }

      render(props) {
        return (
          <div>
            <TestBefore update={this.update} run={props.run}/>
            <TestAfter update={this.update} run={props.run}/>
          </div>
        );
      }
    }

    let testBeforeBeforeSpy,
      testBeforeAfterSpy,
      testAfterBeforeSpy,
      testAfterAfterSpy;

    class TestBefore extends Component {
      constructor(props) {
        super(props);

        this.state = {
          async: 0
        };

        testBeforeBeforeSpy = spy(this, '_before');
        testBeforeAfterSpy = spy(this, '_after');
      }

      _forceASYNC() {
        // hack just for testing, this forces parent is updating so we can test async setState flow
        if (this.state.counter === 1) {
          this.props.update();
        }
      }

      _before() {}

      _after() {}

      _fromCWRP() {
        this._forceASYNC();

        this.setState({
          async: 1
        }, this._before);

        this.setState({
          async: 2
        }, this._after);
      }

      componentWillReceiveProps(nextProps, nextContext) {
        this.setState({
          counter: this.state.counter + 1
        }, this._fromCWRP);
      }

      render() {
        return (
          <div>
            {`${this.state.async}`}
          </div>
        );
      }
    }

    class TestAfter extends Component {
      constructor(props) {
        super(props);

        this.state = {
          async: 0
        };

        testAfterBeforeSpy = spy(this, '_before');
        testAfterAfterSpy = spy(this, '_after');
      }

      _forceASYNC() {
        // hack just for testing, this forces parent is updating so we can test async setState flow
        if (this.state.counter === 1) {
          this.props.update();
        }
      }

      _before() {}

      _after() {}

      _fromCWRP() {
        this._forceASYNC();

        this.setState({
          async: 1
        }, this._before);

        this.setState({
          async: 2
        }, this._after);
      }

      componentWillReceiveProps(nextProps, nextContext) {
        this.setState({
          counter: this.state.counter + 1
        }, this._fromCWRP);
      }

      render() {
        return (
          <div>
            {`${this.state.async}`}
          </div>
        );
      }
    }

    render(<HoC run={1} />, container);
    render(<HoC run={2} />, container);
    // Before micro task runs unmount them
    render(null, container);

    setTimeout(function () {
      // Set state should be called as many times as it was requested
      expect(testBeforeBeforeSpy.callCount).toBe(0);
      expect(testBeforeAfterSpy.callCount).toBe(0);
      expect(testAfterBeforeSpy.callCount).toBe(0);
      expect(testAfterAfterSpy.callCount).toBe(0);

      done();
    }, 20);
  });
});
