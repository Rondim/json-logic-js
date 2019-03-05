import isArray from './helpers/isArray';
import isLogic from './helpers/isLogic';
import getOperator from './helpers/getOperator';

function createJsonLogic(_operations, _visitors) {
  const operations = {};
  const visitors = {};

  if (_operations) {
    Object.keys(_operations).forEach(name => {
      const operation = _operations[name];

      addOperation(operation.code || name, operation);
    });
  }

  if (_visitors) {
    Object.keys(_visitors).forEach(name => {
      const visitor = _visitors[name];

      addVisitor(visitor.code || name, visitor);
    });
  }

  function addOperation(name, code) {
    operations[name] = code;
  }

  function removeOperation(name) {
    delete operations[name];
  }

  function addVisitor(name, code) {
    if (isArray(name)) {
      name.forEach(key => addVisitor(key, code));
      return;
    }

    visitors[name] = code;
  }

  function removeVisitor(name) {
    if (isArray(name)) {
      name.forEach(removeVisitor);
      return;
    }

    delete visitors[name];
  }

  function apply(logic, data = {}) {
    // Does this array contain logic? Only one way to find out.
    if (isArray(logic)) {
      return logic.map(l => apply(l, data));
    }
    // You've recursed to a primitive, stop!
    if (!isLogic(logic)) {
      return logic;
    }

    const op = getOperator(logic);
    let values = logic[op];
    let i;

    // easy syntax for unary operators, like {"var" : "x"} instead of strict {"var" : ["x"]}
    if (!isArray(values)) {
      values = [values];
    }

    // apply matching visitors first
    if (typeof visitors[op] === 'function') {
      return visitors[op](apply, data, values);
    }

    // Everyone else gets immediate depth-first recursion
    values = values.map(val => apply(val, data));

    // The operation is called with "data" bound to its "this" and "values" passed as arguments.
    // Structured commands like % or > can name formal arguments while flexible commands (like missing or merge) can operate on the pseudo-array arguments
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
    const operator = operations[op];
    if (typeof operator === 'function') {
      if (operator.withApply) {
        values.unshift(apply);
      }

      return operator.apply(data, values);
    }
    if (op.indexOf('.') > 0) {
      // Contains a dot, and not in the 0th position
      const sub_ops = String(op).split('.');
      let operation = operations;
      for (i = 0; i < sub_ops.length; i++) {
        // Descending into operations
        operation = operation[sub_ops[i]];
        if (operation === undefined) {
          throw new Error(
            `Unrecognized operation ${op} (failed at ${sub_ops
              .slice(0, i + 1)
              .join('.')})`
          );
        }
      }

      return operation.apply(data, values);
    }

    throw new Error(`Unrecognized operation ${op}`);
  }

  return {
    apply,
    add_operation: addOperation,
    rm_operation: removeOperation,
    add_visitor: addVisitor,
    rm_visitor: removeVisitor,
  };
}

export default createJsonLogic;