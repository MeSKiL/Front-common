export interface returnWxOpenId {
  (success:boolean,openIdOrUrl:string):void
}
export interface getWxOpenIdUrlQuery {
  code?:string
  state?:string
}

export interface WeiXinConfig{
  debug?:boolean
  weChatInnerId:string
  url:string
  requestUrl:string
  callback?:void
  jsApiList?:any

  [propName: string]: any
}

export interface WXConfigClass {
  WXconfig:WeiXinConfig
  config():Promise<boolean>
  hide(hide?:boolean,hideItem?:any):void
  share(title:string, desc:string, link:string, icon:string, timeLineTitle?:string):void
  weChatShareTimeline(title:string, link:string, imgUrl:string, callback?:any):void
  weChatShareAppMessage(title:string, desc:string, link:string, imgUrl:string, callback?:any):void
}
