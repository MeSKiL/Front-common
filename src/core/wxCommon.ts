import axios from 'meskil-ts-axios'
import {getWxOpenIdUrlQuery, returnWxOpenId, WeiXinConfig} from '../types/wxCommon'
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
  hide: false,
  hideItem: ['menuItem:share:appMessage', 'menuItem:share:timeline', 'menuItem:share:qq',
    'menuItem:share:QZone', 'menuItem:share:weiboApp', 'menuItem:copyUrl'],
  callback: () => {
  }
};


class WXConfig {
  WXconfig: WeiXinConfig;

  constructor(WXconfig: WeiXinConfig) {
    this.WXconfig = mergeConfig(defaultWXconfig, WXconfig);
  }

  async config() {
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
      wx.ready(() => {
        if (this.WXconfig.hide) { // 隐藏
          hideWeChatMenuItems(this.WXconfig.hideItem);
        } else { // 不隐藏分享
          hideWeChatMenuItems();
        }
        isFunction(this.WXconfig.callback) && this.WXconfig.callback
      });
    }
  }
}

function weChatConfig(config: WeiXinConfig) {
  return new WXConfig(config)
}

function hideWeChatMenuItems(menuList: any = ['menuItem:share:qq', 'menuItem:share:QZone', 'menuItem:share:weiboApp',
  'menuItem:copyUrl',
]) {
  wx.hideMenuItems({
    menuList // 要隐藏的菜单项，只能隐藏“传播类”和“保护类”按钮，所有menu项见附录4
  });
}

export default {
  initOpenId,
  weChatConfig
}
