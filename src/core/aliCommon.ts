import {getSysDate,getDateAfter_n} from '../util'

/**
 * 模拟form表单提交
 * @param aliConfigId;     // 支付宝ID
 * @param requestUrl       //请求链接
 * @param productDesc;     // 商品描述
 * @param orderNum;        // 订单号
 * @param price;            // 订单总金额
 * @param notifyUrl;       // 支付回调地址
 * @param passbackParams;  // 公用回传参数, 如果请求时传递了该参数，则返回给商户时会回传该参数。支付宝会在异步通知时将该参数原样返回。本参数必须进行UrlEncode之后才可以发送给支付宝
 * @param successUrl;      // 支付成功后的调整地址
 */
function applyAliPay(aliConfigId:string,requestUrl:string,productDesc:string, orderNum:string, price:number, notifyUrl:string, passbackParams:any, successUrl:string) {
  console.log(getSysDate('yyyy-MM-dd'));

  let timeExpire = getDateAfter_n(getSysDate('yyyy-MM-dd'), 3, '-') + " 23:59";

  let tempForm = document.createElement("form");
  tempForm.action = requestUrl;    // 此处地址为固定地址
  tempForm.method = "post";
  tempForm.style.display = "none";

  let opt = document.createElement("input");
  opt.id = "configId";
  opt.name = "configId";
  opt.value = aliConfigId;
  tempForm.appendChild(opt);

  opt = document.createElement("input");
  opt.id = "productDesc";
  opt.name = "productDesc";
  opt.value = productDesc;
  tempForm.appendChild(opt);

  opt = document.createElement("input");
  opt.id = "orderNum";
  opt.name = "orderNum";
  opt.value = orderNum;
  tempForm.appendChild(opt);

  opt = document.createElement("input");
  opt.id = "timeExpire";
  opt.name = "timeExpire";
  opt.value = timeExpire;
  tempForm.appendChild(opt);

  opt = document.createElement("input");
  opt.id = "price";
  opt.name = "price";
  opt.value = price+'';
  tempForm.appendChild(opt);

  opt = document.createElement("input");
  opt.id = "passbackParams";
  opt.name = "passbackParams";
  opt.value = passbackParams;
  tempForm.appendChild(opt);

  opt = document.createElement("input");
  opt.id = "notifyUrl";
  opt.name = "notifyUrl";
  opt.value = notifyUrl;
  tempForm.appendChild(opt);

  opt = document.createElement("input");
  opt.id = "successUrl";
  opt.name = "successUrl";
  opt.value = successUrl;
  tempForm.appendChild(opt);

  document.body.appendChild(tempForm);
  tempForm.submit();
}

export default {
  applyAliPay
}
