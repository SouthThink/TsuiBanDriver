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
    moving: "移动",
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

// 定义一个函数，用于合并两个对象
const mergeObjects = (obj1, obj2) => {
  // 创建一个空对象，用于存放合并后的结果
  let result = {};

  // 遍历第一个对象的属性
  for (let key in obj1) {
    // 如果第二个对象也有相同的属性
    if (obj2.hasOwnProperty(key)) {
      // 如果两个属性都是对象，则递归调用mergeObjects函数，将两个对象合并
      if (typeof obj1[key] === "object" && typeof obj2[key] === "object") {
        result[key] = mergeObjects(obj1[key], obj2[key]);
      } else {
        // 如果两个属性不是对象，则将第二个对象的属性值赋给结果对象
        result[key] = obj2[key];
      }
    } else {
      // 如果第二个对象没有相同的属性，则将第一个对象的属性值赋给结果对象
      result[key] = obj1[key];
    }
  }

  // 遍历第二个对象的属性
  for (let key in obj2) {
    // 如果第一个对象没有相同的属性，则将第二个对象的属性值赋给结果对象
    if (!obj1.hasOwnProperty(key)) {
      result[key] = obj2[key];
    }
  }

  // 返回合并后的结果对象
  return result;
};

import { addTorrents } from "@/api/yzrServer";

// 定义一个函数，用于创建下载任务
const createDownload = (url, name) => {
  // 打印下载链接和下载名称
  console.log("下载", url);
  console.log("下载", name);
  // 弹出弹窗，中间是输入框，标题是请输入订阅链接
  ElMessageBox.prompt("请输入保存地址", "添加下载任务", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
  })
    .then(({ value }) => {
      // 弹出通知，提示正在添加下载任务
      ElNotification({
        title: "正在添加下载任务",
        message: name,
        type: "info",
      });
      // 调用addTorrents函数，传入下载链接和保存地址，并返回结果
      addTorrents({ urls: url, savepath: value }).then((res) => {
        // 如果返回结果的状态码为200，则弹出通知，提示添加成功
        if (res.code === 200) {
          ElNotification({
            title: "添加成功",
            message: "添加成功",
            type: "success",
          });
        } else {
          // 否则弹出通知，提示添加失败
          ElNotification({
            title: "添加失败",
            message: "添加失败",
            type: "error",
          });
        }
      });
    })
    .catch(() => {
      // 如果用户取消添加，则打印取消添加
      console.log("取消添加");
    });
};

// 深度比较两个对象是否相等
const deepEqual = (a, b) => {
  // 如果两个对象相等，则返回true
  if (a === b) return true;
  // 如果两个对象中有一个不是对象，或者两个对象都是null，则返回false
  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  )
    return false;
  // 获取两个对象的键
  let keysA = Object.keys(a),
    keysB = Object.keys(b);
  // 如果两个对象的键的数量不相等，则返回false
  if (keysA.length !== keysB.length) return false;
  // 遍历第一个对象的键
  for (let key of keysA) {
    // 如果第二个对象不包含该键，或者该键对应的值不相等，则返回false
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
  }
  // 如果所有键都相等，则返回true
  return true;
};

import { computed } from "vue";
//获取屏幕宽度
const screenWidth = window.innerWidth;
const isMobile = computed(() => screenWidth <= 768);
const setSize = computed(() => {
  if (isMobile.value) {
    return '100%';
  } else {
    return '50%';
  }
});

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
  setSize,
  isMobile,
  screenWidth,
};
