import axios from 'meskil-ts-axios'
import {getWxOpenIdUrlQuery, returnWxOpenId, WeiXinConfig, WXConfigClass, signFunc} from '../types/wxCommon'
// @ts-ignore
import qs from 'qs'
// @ts-ignore
import wx from 'weixin-js-sdk';
import mergeConfig from '../util/mergeConfig'
import {isFunction} from "../util";


/**
 *
 * @param params {getWxOpenIdUrlQuery} 存在state和code的对象
 * @param weChatInnerId {String} innerId
 * @param weChatAppId  {String} appId
 * @param url {String} 当前地址url
 * @param requestUrl {String} 请求openId的请求链接
 * @param callback (success:boolean,openIdOrUrl:string):void  callback的参数为true时,res就是openId，callback的参数为false时，res可能为空，可能为redirectUrl，为空时报错，为redirectUrl时window.href跳转
 *
 * @returns {boolean} 返回是否成功的布尔类型值
 *
 * @example
 *  WxCommon.initOpenId(this.$route.query,process.env.VUE_APP_WE_CHAT_INNER_ID,process.env.VUE_APP_WE_CHAT_APP_ID,process.env.VUE_APP_PROJECT_URL_PREFIX+'/rights/pages/homePage/homePage',process.env.VUE_APP_PAY_CENTER_API_ROOT+Urls.GET_OPEN_ID_BY_WE_CHAT_CODE_API,(success,openId) => {
				console.log(success,openId)
				if(!success&&openId){
					window.location.href = openId
				}
		})
 */

async function initOpenId(params: getWxOpenIdUrlQuery, weChatInnerId: string, weChatAppId: string, url: string, requestUrl: string, callback: returnWxOpenId): Promise<Boolean> {
  const {state, code} = params;
  let stateParams = '';
  if (state) {
    stateParams = state;
  }
  if (code) { // 如果有code直接拿openId
    const res = await getOpenId(code, weChatInnerId, requestUrl);
    if (res) {
      callback(true, res);
      return true
    } else {
      callback(false, res);
      return false;
    }
  } else {
    const redirectUrl = genGetCodeUrl(url, weChatAppId, stateParams);
    callback(false, redirectUrl);
    return false;
  }
}

async function getOpenId(code: string, weChatInnerId: string, requestUrl: string): Promise<string> {
  const params = {
    code,
    weChatInnerId
  };
  const res = await axios(requestUrl, {params});
  if (res.data.code === 1000) {
    return res.data.data // openId
  }
  return ''
}

function genGetCodeUrl(redirectUri: string, weChatAppId: string, stateParams: string) {
  return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${weChatAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=snsapi_base&state=${stateParams}#wechat_redirect'`;
}


let defaultJsApiList = [
  "hideMenuItems",
  "onMenuShareTimeline",
  "onMenuShareAppMessage",
  "updateAppMessageShareData",
  "updateTimelineShareData",
];

let defaultWXconfig = {
  debug: false,
  jsApiList: defaultJsApiList,

  callback: () => {
  }
};


/**
 weChatConfig(arg) {
    let params = {
      weChatInnerId: process.env.VUE_APP_WE_CHAT_INNER_ID,
      url,
      requestUrl: process.env.VUE_APP_PAY_CENTER_API_ROOT + Urls.GET_WE_CHAT_CONFIG_API,
    }
    const result = mergeConfig(params, arg);
    const config = WxCommon.weChatConfig(result);
    config.config();
  }
 config.hide(true,['menuItem:share:appMessage', 'menuItem:share:timeline', 'menuItem:share:qq'])
 config.hide() // ['menuItem:share:qq', 'menuItem:share:QZone', 'menuItem:share:weiboApp','menuItem:copyUrl',]
 config.hide(true) // ['menuItem:share:appMessage', 'menuItem:share:timeline', 'menuItem:share:qq', 'menuItem:share:QZone', 'menuItem:share:weiboApp', 'menuItem:copyUrl']
 config.share('测试分享','这是测试分享','http://uat.jz-ins.cn/uat/uniAppCore/pages/index/index','','这是朋友圈的测试分享')
 config.weChatShareAppMessage('测试分享','这是测试分享','http://uat.jz-ins.cn/uat/uniAppCore/pages/index/index','')
 config.weChatShareTimeline('测试分享','http://uat.jz-ins.cn/uat/uniAppCore/pages/index/index','')
 * */

class WXConfig implements WXConfigClass {
  WXconfig: WeiXinConfig;

  constructor(WXconfig: WeiXinConfig) {
    this.WXconfig = mergeConfig(defaultWXconfig, WXconfig);
  }

  async config(): Promise<boolean> {
    const genConfigParams = {
      weChatConfigId: this.WXconfig.weChatInnerId,
      targetUrl: this.WXconfig.url,
    };
    const res = await axios.post(this.WXconfig.requestUrl, qs.stringify(genConfigParams), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    if (res.data.code === 1000) {
      const resData = res.data.data;
      const {
        timestamp,
        nonceStr,
        signature,
        appId
      } = resData;
      const configData = {
        debug: this.WXconfig.debug, // 开启调试模式
        appId, // 必填，公众号的唯一标识
        timestamp, // 必填，生成签名的时间戳
        nonceStr, // 必填，生成签名的随机串
        signature, // 必填，签名，见附录1
        jsApiList: this.WXconfig.jsApiList,
      };
      wx.config(configData);
      isFunction(this.WXconfig.callback) && this.WXconfig.callback;
      return true
    } else {
      return false
    }
  }

  hide(hide: boolean = false, hideItem: any = ['menuItem:share:appMessage', 'menuItem:share:timeline', 'menuItem:share:qq',
    'menuItem:share:QZone', 'menuItem:share:weiboApp', 'menuItem:copyUrl']): void {
    wx.ready(() => {
      if (hide) { // 隐藏
        hideWeChatMenuItems(hideItem);
      } else { // 不隐藏分享
        hideWeChatMenuItems();
      }
    });
  }

  share(title: string, desc: string, link: string, icon: string, timeLineTitle?: string): void {
    this.weChatShareTimeline((timeLineTitle ? timeLineTitle : title), link, icon);
    this.weChatShareAppMessage(title, desc, link, icon);
  }

  weChatShareTimeline(title: string, link: string, imgUrl: string, callback?: any): void {
    let ret: any = {};
    wx.ready(() => {
      wx.onMenuShareTimeline({
        // 分享标题
        title,
        // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
        link,
        // 分享图标
        imgUrl,
        // 用户确认分享后执行的回调函数
        success() {
          console.log('分享回调函数');
          console.log(`shareLink= ${link}`);
          if (callback && isFunction(callback)) {
            ret = {
              success: true,
              type: '1',
              msg: '分享成功',
            };
            callback(ret);
          }
        },
        // 用户取消分享后执行的回调函数
        cancel() {
          console.log('取消分享回调函数');
          // alert('取消分享回调函数');
          if (callback && isFunction(callback)) {
            ret = {
              success: false,
              type: '2',
              msg: '取消分享',
            };
            callback(ret);
          }
        },
        fail(res: any) {
          if (callback && isFunction(callback)) {
            ret = {
              success: false,
              type: '3',
              msg: res,
            };
            callback(ret);
          }
        },
      });
    });
  }

  weChatShareAppMessage(title: string, desc: string, link: string, imgUrl: string, callback?: any): void {
    let ret = {};
    wx.ready(() => {
      wx.onMenuShareAppMessage({
        // 分享标题
        title,
        // 分享描述
        desc,
        // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
        link,
        // 分享图标
        imgUrl,
        // 用户确认分享后执行的回调函数
        success() {
          console.log('分享回调函数');
          console.log(`shareLink= ${link}`);
          if (callback && isFunction(callback)) {
            ret = {
              success: true,
              type: '1',
              msg: '分享成功',
            };
            callback(ret);
          }
        },
        // 用户取消分享后执行的回调函数
        cancel() {
          console.log('取消分享回调函数');
          // alert('取消分享回调函数');
          if (callback && isFunction(callback)) {
            ret = {
              success: false,
              type: '2',
              msg: '取消分享',
            };
            callback(ret);
          }
        },
        fail(res: any) {
          if (callback && isFunction(callback)) {
            ret = {
              success: false,
              type: '3',
              msg: res,
            };
            callback(ret);
          }
        },
      });
    });
  }

  async payForH5InnerId(productDesc: string, orderNum: string, price: number, notifyUrl: string, successUrl: string, requestUrl: string, openId: string, isWeChat: boolean, signFunc?: signFunc<any>, apiRootType?: string, attach: string = 'attach', failureUrl?: string, callback?: any) {

    if (signFunc && isFunction(signFunc) && apiRootType) {
      const instance = axios.create();
      instance.interceptors.request.use(config => {
        config.data = signFunc(config.data, apiRootType);
        return config
      });
    }


    const successRedirectUrl = encodeURIComponent(successUrl);
    const tradeType = isWeChat ? 'JSAPI' : 'MWEB';
    const applyPayDataParams = {
      weChatConfigId: this.WXconfig.weChatInnerId,
      productDesc,
      orderNum,
      price,
      notifyUrl,
      tradeType,
      attach,
      openId,
    };
    console.log('微信预支付需要的参数 applyPayDataParams : ', applyPayDataParams);

    // 声明用于接收发起支付请求后的返回结果
    let timestamp = '';
    let nonceStr = '';
    let prepayId = '';
    let signType = '';
    let paySign = '';
    let mwebUrl = '';

    const res = await axios.post(requestUrl, applyPayDataParams, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (res.data.code === 1000) {
      const payResultData = res.data.data;
      // 声明用于接收发起支付请求后的返回结果
      timestamp = payResultData.timeStamp;
      nonceStr = payResultData.nonceStr;
      prepayId = payResultData.prepayId;
      signType = payResultData.signType;
      paySign = payResultData.paySign;
      mwebUrl = isWeChat ? '' : payResultData.mwebUrl;

      if (isWeChat) {
        // 配置完以后才能在此方法中调起微信支付的弹窗
        wx.ready(() => {
          // 就绪后的处理
          wx.chooseWXPay({
            timestamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
            nonceStr, // 支付签名随机串，不长于 32 位
            package: `prepay_id=${prepayId}`, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
            signType, // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
            paySign, // 支付签名
            success(res: any) {
              if (successUrl !== null && successUrl !== '') {
                // alert(successUrl)
                window.location.href = successUrl;
                // alert('支付成功');
              } else {
                alert('支付成功, 下一步跳转页面');
              }
            },
            Error(err: any) {
              if (failureUrl !== null && failureUrl !== '') {
                alert('支付失败');
              } else {
                alert(`支付失败, 错误信息:${err}`);
              }
            },
            cancel(res: any) {
              // alert('取消支付');
              if (callback && callback instanceof Function) {
                callback(res);
              }
            },
            fail(res: any) {
              // alert("支付失败");
              if (callback && callback instanceof Function) {
                callback(res);
              }
            },
          });
        });
      } else {
        window.location.href = `${mwebUrl}&redirect_url=${successRedirectUrl}`;
      }
    }
  }
}

function hideWeChatMenuItems(menuList: any = ['menuItem:share:qq', 'menuItem:share:QZone', 'menuItem:share:weiboApp',
  'menuItem:copyUrl',
]): void {
  wx.hideMenuItems({
    menuList // 要隐藏的菜单项，只能隐藏“传播类”和“保护类”按钮，所有menu项见附录4
  });
}


async function weChatConfig(config: WeiXinConfig): Promise<WXConfigClass> {
  const instance = new WXConfig(config);
  const res = await instance.config();
  if (!res) {
    console.error('config 请求出错');
  }
  return instance
}


export default {
  initOpenId,
  weChatConfig,
}
