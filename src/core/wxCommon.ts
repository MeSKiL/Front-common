import axios from 'meskil-ts-axios'
import {getWxOpenIdUrlQuery, returnWxOpenId, WeiXinConfig,WXConfigClass} from '../types/wxCommon'
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
 * */

class WXConfig implements WXConfigClass{
  WXconfig: WeiXinConfig;

  constructor(WXconfig: WeiXinConfig) {
    this.WXconfig = mergeConfig(defaultWXconfig, WXconfig);
  }

  async config():Promise<boolean> {
    const genConfigParams = {
      weChatConfigId: this.WXconfig.weChatInnerId,
      targetUrl: this.WXconfig.url,
    };
    const res = await axios.post(this.WXconfig.requestUrl, qs.stringify(genConfigParams), {
      headers: {
        'Content-Type':'application/x-www-form-urlencoded'
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
    }else{
      return false
    }
  }

  hide(hide:boolean,hideItem:any = ['menuItem:share:appMessage', 'menuItem:share:timeline', 'menuItem:share:qq',
    'menuItem:share:QZone', 'menuItem:share:weiboApp', 'menuItem:copyUrl'],):void{
    wx.ready(() => {
      if (hide) { // 隐藏
        hideWeChatMenuItems(hideItem);
      } else { // 不隐藏分享
        hideWeChatMenuItems();
      }
    });
  }
}

function weChatConfig(config: WeiXinConfig):WXConfigClass {
  return new WXConfig(config)
}

function hideWeChatMenuItems(menuList: any = ['menuItem:share:qq', 'menuItem:share:QZone', 'menuItem:share:weiboApp',
  'menuItem:copyUrl',
]):void {
  wx.hideMenuItems({
    menuList // 要隐藏的菜单项，只能隐藏“传播类”和“保护类”按钮，所有menu项见附录4
  });
}


// function share(title:string, desc:string, link:string, icon:string, timeLineTitle?:string):void {
//   weChatShareTimeline((timeLineTitle?timeLineTitle : title), link, icon);
//   weChatShareAppMessage(title, desc, link, icon);
// }
//
// function weChatShareTimeline(title:string, link:string, imgUrl:string, callback?:any) {
//   let ret:any = {};
//   wx.ready(() => {
//     wx.onMenuShareTimeline({
//       // 分享标题
//       title,
//       // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
//       link,
//       // 分享图标
//       imgUrl,
//       // 用户确认分享后执行的回调函数
//       success() {
//         console.log('分享回调函数');
//         console.log(`shareLink= ${link}`);
//         if (callback && isFunction(callback)) {
//           ret = {
//             success: true,
//             type: '1',
//             msg: '分享成功',
//           };
//           callback(ret);
//         }
//       },
//       // 用户取消分享后执行的回调函数
//       cancel() {
//         console.log('取消分享回调函数');
//         // alert('取消分享回调函数');
//         if (callback && isFunction(callback)) {
//           ret = {
//             success: false,
//             type: '2',
//             msg: '取消分享',
//           };
//           callback(ret);
//         }
//       },
//       fail(res:any) {
//         if (callback && isFunction(callback)) {
//           ret = {
//             success: false,
//             type: '3',
//             msg: res,
//           };
//           callback(ret);
//         }
//       },
//     });
//   });
// }
//
// function weChatShareAppMessage(title, desc, link, imgUrl, callback?:void) {
//   let ret = {};
//   wx.ready(() => {
//     wx.onMenuShareAppMessage({
//       // 分享标题
//       title,
//       // 分享描述
//       desc,
//       // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
//       link,
//       // 分享图标
//       imgUrl,
//       // 用户确认分享后执行的回调函数
//       success() {
//         console.log('分享回调函数');
//         console.log(`shareLink= ${link}`);
//         if (callback && callback instanceof Function) {
//           ret = {
//             success: true,
//             type: '1',
//             msg: '分享成功',
//           };
//           callback(ret);
//         }
//       },
//       // 用户取消分享后执行的回调函数
//       cancel() {
//         console.log('取消分享回调函数');
//         // alert('取消分享回调函数');
//         if (callback && callback instanceof Function) {
//           ret = {
//             success: false,
//             type: '2',
//             msg: '取消分享',
//           };
//           callback(ret);
//         }
//       },
//       fail(res) {
//         if (callback && callback instanceof Function) {
//           ret = {
//             success: false,
//             type: '3',
//             msg: res,
//           };
//           callback(ret);
//         }
//       },
//     });
//   });
// },


export default {
  initOpenId,
  weChatConfig
}
