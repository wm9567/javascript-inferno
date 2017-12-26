import {render, NO_OP, createTextVNode, linkEvent, version} from "inferno";

uibench.init('Inferno', version);

function TreeLeaf({children}) {
  return (
    <li
      $NoNormalize
      className="TreeLeaf">
      {createTextVNode(children)}
    </li>
  );
}

function shouldDataUpdate(lastProps, nextProps) {
  return lastProps !== nextProps;
}

function TreeNode({data}) {
  var length = data.children.length;
  var children = new Array(length);

  for (var i = 0; i < length; i++) {
    var n = data.children[i];
    var id = n.id;

    if (n.container) {
      children[i] = <TreeNode onComponentShouldUpdate={shouldDataUpdate} data={n} key={id}/>;
    } else {
      children[i] = <TreeLeaf onComponentShouldUpdate={shouldDataUpdate} key={id}>{id}</TreeLeaf>;
    }
  }

  return (
    <ul
      $NoNormalize
      $HasKeyedChildren
      className="TreeNode">
      {children}
    </ul>
  );
}

function tree(data) {
  /*
   * $NoNormalize flag is not needed here, because shape of children is known by the compiler
   * <div> has static children <TreeNode> so there is no need for $NoNormalize
   */
  return (
    <div className="Tree">
      <TreeNode data={data.root} onComponentShouldUpdate={shouldDataUpdate}/>
    </div>
  );
}

function AnimBox({data}) {
  var time = data.time % 10;
  var style = 'border-radius:' + (time) + 'px;' +
    'background:rgba(0,0,0,' + (0.5 + ((time) / 10)) + ')';

  // We don't need to use $NoNormalize here, because there is no Children
  // $NoNormalize needs to be used only when you want to optimize the children type
  return (
    <div
      data-id={data.id}
      style={style}
      className="AnimBox"
    />
  );
}

function anim(data) {
  var items = data.items;
  var length = items.length;
  var children = new Array(length);

  for (var i = 0; i < length; i++) {
    var item = items[i];

    // Here we are using onComponentShouldUpdate functional Component hook, to short circuit rendering process of AnimBox Component
    // When the data does not change
    children[i] = <AnimBox data={item} onComponentShouldUpdate={shouldDataUpdate} key={item.id}/>;
  }

  return (
    <div
      $HasKeyedChildren
      $NoNormalize
      className="Anim">
      {children}
    </div>
  );
}

function onClick(text, e) {
  console.log('Clicked', text);
  e.stopPropagation();
}

function TableCell({children}) {
  /*
   * Here we want to optimize for having text child vNode,
   * It can be done by using $NoNormalize on parent element
   * and manually calling createTextVNode(value) for the children
   *
   * linkEvent is used here to bind the first parameter (text) into second parameter onClick function
   * linkEvent has benefit of not creating function, it basically returns pre-defined object shape that inferno knows how to handle
   * the main benefit is that no ".bind" or arrow function "() => {}" is needed. It works well with functional Components
   */
  return (
    <td
      $NoNormalize
      onClick={linkEvent(children, onClick)}
      className="TableCell">
      {createTextVNode(children)}
    </td>
  );
}

function TableRow({data}) {
  var classes = 'TableRow';

  if (data.active) {
    classes = 'TableRow active';
  }
  var cells = data.props;
  var length = cells.length + 1;
  var children = new Array(length);

  children[0] = <TableCell onComponentShouldUpdate={shouldDataUpdate}>{'#' + data.id}</TableCell>;

  for (var i = 1; i < length; i++) {
    children[i] = <TableCell onComponentShouldUpdate={shouldDataUpdate}>{cells[i - 1]}</TableCell>;
  }

  /*
   * Again there is element vNode which children we know before runTime.
   * Add optimization flags ($NoNormalize + Children type)
   * This time childrens does not have key, so the type is $HasNonKeyedChildren
   */
  return (
    <tr
      data-id={data.id}
      className={classes}
      $NoNormalize
      $HasNonKeyedChildren>
      {children}
    </tr>
  );
}

function table(data) {
  var items = data.items;
  var length = items.length;
  var children = new Array(length);

  for (var i = 0; i < length; i++) {
    var item = items[i];

    // Components does not need $NoNormalize flag, it does not hurt, but gains nothing
    // Because Component children will be passed through props and will not be normalized before rendering anyway
    children[i] = <TableRow data={item} onComponentShouldUpdate={shouldDataUpdate} key={item.id}>{item}</TableRow>;
  }

  /*
   * When its known that given element has only one type of children we can optimize this compile time
   * by adding children type $HasKeyedChildren (list of children - all keyed)
   * $NoNormalize means that there are no holes in the children array and all keys are correctly set
   */
  return (
    <table
      $HasKeyedChildren
      $NoNormalize
      className="Table">
      {children}
    </table>
  );
}

var lastMainData;

function main(data) {
  if (data === lastMainData) {
    /*
    * We can short circuit rendering process, by returning Inferno.NO_OP
    * It behaves same way as shouldComponentUpdate => false
    * */
    return NO_OP;
  }
  lastMainData = data;
  var location = data.location;
  var section;

  if (location === 'table') {
    section = table(data.table);
  } else if (location === 'anim') {
    section = anim(data.anim);
  } else if (location === 'tree') {
    section = tree(data.tree);
  }

  /*
   * We know that this div will always have single vNode as its children,
   * so we can optimize here and add flag $NoNormalize
   */
  return (
    <div
      $NoNormalize
      className="Main">
      {section}
    </div>
  );
}

document.addEventListener('DOMContentLoaded', function(e) {
  var container = document.querySelector('#App');

  uibench.run(
    function(state) {
      render(main(state), container);
    },
    function(samples) {
      render(<pre>{JSON.stringify(samples, null, ' ')}</pre>, container);
    }
  );
});
