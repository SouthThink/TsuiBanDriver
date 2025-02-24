import http from 'axios';

function request(BASE_URL,config) {
  const token = localStorage.getItem('token') || '';
  if(token){
    config.params = config.params || {};
    config.params['access_token'] = token;
  }
  return new Promise((resolve, reject) => {
    http({
      url: BASE_URL + config.url,
      method: config.method || 'GET',
      params: config.params,
      data: config.data,
      headers: {
        "Authorization": token
      },
      withCredentials: true,
    })
    .then(res => {
      if(res.data.code == 401){
        // 处理登录状态过期的情况
      } else {
        resolve(res.data);
      }
    })
    .catch(err => {
      reject(err);
    });
  });
}

export default request;
