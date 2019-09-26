const toString = Object.prototype.toString;

export function isPlainObject(val: any): val is Object { // 是否为纯对象
  return toString.call(val) === '[object Object]'
}

export function isFunction(func: any){ // 是否为纯对象
  return typeof func === 'function';
}
