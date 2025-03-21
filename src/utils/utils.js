//计算文件大小
const fileSize = (size) => {
  if (size < 1024) {
    return size + "B";
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + "KB";
  } else if (size < 1024 * 1024 * 1024) {
    return (size / 1024 / 1024).toFixed(2) + "MB";
  } else {
    return (size / 1024 / 1024 / 1024).toFixed(2) + "GB";
  }
};

//时间戳转换成日期格式
const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

//秒数转换成时间格式
const formatTime = (seconds) => {
  if (seconds === 8640000) {
    return "--:--:--";
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  // 补零函数
  const pad = (num) => num.toString().padStart(2, "0");

  // 根据天数判断输出格式
  return days > 0
    // ? `${days}天${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`
    ? `大于${days}天`
    : `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
};

//转换下载速度
const formatSpeed = (speed) => {
  if (speed < 1024) {
    return speed + "B/s";
  } else if (speed < 1024 * 1024) {
    return (speed / 1024).toFixed(2) + "KB/s";
  } else if (speed < 1024 * 1024 * 1024) {
    return (speed / 1024 / 1024).toFixed(2) + "MB/s";
  } else {
    return (speed / 1024 / 1024 / 1024).toFixed(2) + "GB/s";
  }
};

//状态转换成中文
const stateText = (state) => {
  let stateType = {
    stalledUP: "做种",
    stalledDL: "等待",
    checkingUP: "检查",
    checkingDL: "检查",
    downloading: "下载",
    finished: "完成",
  };
  return stateType[state];
};
//状态转换成颜色
const stateColor = (state) => {
  let stateType = {
    stalledUP: "info",
    stalledDL: "primary",
    checkingUP: "warning",
    checkingDL: "warning",
    downloading: "success",
    finished: "success",
  };
  return stateType[state];
};

const mergeObjects = (obj1, obj2) => {
  let result = {};

  for (let key in obj1) {
    if (obj2.hasOwnProperty(key)) {
      if (typeof obj1[key] === "object" && typeof obj2[key] === "object") {
        result[key] = mergeObjects(obj1[key], obj2[key]);
      } else {
        result[key] = obj2[key];
      }
    } else {
      result[key] = obj1[key];
    }
  }

  for (let key in obj2) {
    if (!obj1.hasOwnProperty(key)) {
      result[key] = obj2[key];
    }
  }

  return result;
};

import { addTorrents } from "@/api/download";

const createDownload = (url, name) => {
  console.log("下载", url);
  console.log("下载", name);
  // 弹出弹窗，中间是输入框，标题是请输入订阅链接
  ElMessageBox.prompt("请输入保存地址", "添加下载任务", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
  })
    .then(({ value }) => {
      ElNotification({
        title: "正在添加下载任务",
        message: name,
        type: "info",
      });
      addTorrents({ urls: url, savepath: value }).then((res) => {
        if (res.code === 200) {
          ElNotification({
            title: "添加成功",
            message: "添加成功",
            type: "success",
          });
        } else {
          ElNotification({
            title: "添加失败",
            message: "添加失败",
            type: "error",
          });
        }
      });
    })
    .catch(() => {
      console.log("取消添加");
    });
};

const deepEqual = (a, b) => {
  if (a === b) return true;
  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  )
    return false;
  let keysA = Object.keys(a),
    keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
  }
  return true;
};

export {
  fileSize,
  formatDate,
  formatTime,
  formatSpeed,
  stateText,
  mergeObjects,
  createDownload,
  deepEqual,
  stateColor,
};
