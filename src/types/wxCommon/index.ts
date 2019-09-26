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
  hide?:boolean
  hideItem?:any

  [propName: string]: any
}
