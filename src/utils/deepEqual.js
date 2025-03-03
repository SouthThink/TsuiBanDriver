//数组对象对比方法
function deepEqual(a, b) {
    if (a === b) return true;
    if (
      typeof a !== "object" ||
      a === null ||
      typeof b !== "object" ||
      b === null
    )
      return false;
    let keysA = Object.keys(a),
      keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (let key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

export default deepEqual