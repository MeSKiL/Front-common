import {getYzlOpenIdUrlQuery,yzlOpenIdCallback} from '../types/yzlCommon'
import axios from 'meskil-ts-axios';
import {isFunction} from "../util";

async function initOpenId(query:getYzlOpenIdUrlQuery,yzlAppId:string,yzlInnerId:string,url:string,requestUrl:string,callback:yzlOpenIdCallback):Promise<boolean> {
  const {code,state} = query;
  if(code){
    const params = {
      code,
      longQueConfigId:yzlInnerId,
      getUserInfo:'1' // 可能修改
    };
    const res = await axios(requestUrl,{params});
    if(res.data.code===1000){
      const resData = res.data.data;
      const {openId,userInfo} = resData;
      isFunction(callback)&&callback(true,openId,userInfo);
      return true
    }else{
      return false
    }
  }else{
    let redirectUrl:string;
    if(state){
      redirectUrl = genGetCodeUrl(yzlAppId,url,state);
    }else{
      redirectUrl = genGetCodeUrl(yzlAppId,url);
    }
    isFunction(callback)&&callback(false,redirectUrl);
    return false
  }
}

function genGetCodeUrl(yzlAppId:string,redirectUri:string,state:string = '') {
  return `https://oauth.yzl.longqueyun.com/connect/oauth2/authorize?appid=${yzlAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=snsapi_base&state=${state}`;
}

export default {
  initOpenId
}
