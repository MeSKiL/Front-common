import { WeiXinConfig} from '../types/wxCommon'

function defaultStrat(val1: any, val2: any): any { // val2不为空，采用val2,否则采用val1
  return typeof val2 !== 'undefined' ? val2 : val1
}

export default function mergeConfig(config1: any, config2?: any): WeiXinConfig {
  if (!config2) {
    config2 = {}
  }
  const config = Object.create(null);
  for (let key in config2) {
    config[key] = defaultStrat(config1[key], config2![key]) // config2里的key都走mergeField方法
  }
  for (let key in config1) {
    if (!config2[key]) { // config1里的并且config2里没有的key，走mergeField
      config[key] = defaultStrat(config1[key], config2![key])
    }
  }
  return config
}
