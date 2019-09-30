export interface getYzlOpenIdUrlQuery {
  code?:string
  state?:string
}

export interface yzlOpenIdCallback {
  (successOrNot:boolean,openId:string,userInfo?:any):void
}
