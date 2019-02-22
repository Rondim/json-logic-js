import isArray from '../../helpers/isArray';
import variable from './variable'

function missing(apply, ...args) {
  /*
  Missing can receive many keys as many arguments, like {"missing:[1,2]}
  Missing can also receive *one* argument that is an array of keys,
  which typically happens if it's actually acting on the output of another command
  (like 'if' or 'merge')
  */

  var missing = [];
  var keys = isArray(args[0]) ? args[0] : args;

  for(var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = apply({"var": key}, this);
    if(value === null || value === "") {
      missing.push(key);
    }
  }

  return missing;
};

missing.withApply = true;

export default missing;
