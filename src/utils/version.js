import config from '../../package.json'
export function getVersion() {
  return config.version || '0.0.0'
}