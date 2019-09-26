export interface returnWxOpenId {
  (success:boolean,openIdOrUrl:string):void
}
export interface getWxOpenIdUrlQuery {
  code?:string
  state?:string
}
