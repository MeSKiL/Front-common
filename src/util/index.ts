const toString = Object.prototype.toString;

export function isPlainObject(val: any): val is Object { // 是否为纯对象
  return toString.call(val) === '[object Object]'
}

export function isFunction(func: any){ // 是否为纯对象
  return typeof func === 'function';
}


function dateFormat(date:Date,fmt:string){
  let o:any = {
    "M+": date.getMonth() + 1,                 //月份
    "d+": date.getDate(),                    //日
    "h+": date.getHours(),                   //小时
    "m+": date.getMinutes(),                 //分
    "s+": date.getSeconds(),                 //秒
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
    "S": date.getMilliseconds()             //毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (let k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

export function getSysDate(parsePatterns:string):string{
  if (parsePatterns) {
    return dateFormat(new Date(),parsePatterns);
  } else {
    return '';
  }
}

/**
 * 计算n天后的日期
 * initDate：开始日期，默认为当天日期， 格式：yyyymmdd/yyyy-mm-dd
 * days:天数
 * flag：返回值， 年与日之间的分隔符， 默认为xxxx年xx月xx日格式
 */
export function getDateAfter_n(initDate:string, days:number, flag:string):string{
  if (!days) {
    return initDate;
  }
  initDate = initDate.replace(/-/g, '');
  flag = flag.trim();
  let date;
  // 是否设置了起始日期
  if (!initDate.trim()) { // 没有设置初始化日期，就默认为当前日期
    date = new Date();
  } else {
    let year = initDate.substring(0, 4);
    let month = initDate.substring(4, 6);
    let day = initDate.substring(6, 8);
    date = new Date(Number(year), Number(month) - 1, Number(day)); // 月份是从0开始的
  }
  date.setDate(date.getDate() + days);

  let yearStr = date.getFullYear();
  let monthStr = ("0" + (date.getMonth() + 1)).slice(-2, 8); // 拼接2位数月份
  let dayStr = ("0" + date.getDate()).slice(-2, 8); // 拼接2位数日期
  let result = "";
  if (!flag) {
    result = yearStr + "年" + monthStr + "月" + dayStr + "日";
  } else {
    result = yearStr + flag + monthStr + flag + dayStr;
  }
  return result;
};
