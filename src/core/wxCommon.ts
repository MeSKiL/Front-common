import axios from 'meskil-ts-axios'
import {getWxOpenIdUrlQuery, returnWxOpenId} from '../types/wxCommon'

type responseOpenId = string

// callback的参数为true时,res就是openId
// callback的参数为false时，res可能为空，可能为redirectUrl，为空时报错，为redirectUrl时window.href跳转

async function initOpenId(params:getWxOpenIdUrlQuery,weChatInnerId:string,weChatAppId:string,url:string,requestUrl:string,callback:returnWxOpenId):Promise<Boolean> {
  const {state,code} = params;
  let stateParams = '';
  if(state){
    stateParams = state;
  }
  if(code){ // 如果有code直接拿openId
    const res = await getOpenId(code,weChatInnerId,requestUrl);
    if(res){
      callback(true,res);
      return true
    }else{
      callback(false,res);
      return false;
    }
  }else{
    const redirectUrl = genGetCodeUrl(url,weChatAppId,stateParams);
    callback(false,redirectUrl);
    return false;
  }
}

async function getOpenId(code:string,weChatInnerId:string,requestUrl:string):Promise<responseOpenId> {
  const params = {
    code,
    weChatInnerId
  };
  const res = await axios(requestUrl,{params});
  if(res.data.code===1000){
    return res.data.data // openId
  }
  return ''
}

function genGetCodeUrl(redirectUri:string,weChatAppId:string,stateParams:string) {
  return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${weChatAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=snsapi_base&state=${stateParams}#wechat_redirect'`;
}

export default {
  initOpenId
}
