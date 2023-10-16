let fileName = null;
let json = null;

let objects_pages = {};
const objects_per_page = 20;

onmessage = ({ data }) => {
  if (data.type === "load") {
    load(data.file);
  }

  if (data.type === "more") {
    next(data.keyName);
  }

  if (data.type === "reset") {
    fileName = null;
    json = null;
    objects_pages = {};
  }
};

function load(file) {
  try {
    json = JSON.parse(new FileReaderSync().readAsText(file));
    fileName = file.name;
  } catch (err) {
    console.log(err);
    postMessage({ isValid: false, json: null, fileName: file.name });
    return;
  }

  next();
}

function next(keyName = "root") {
  const keyPath = keyName.split(":").slice(1);
  let target = json;
  for (let key of keyPath) {
    target = target[key];
  }

  postMessage({
    isValid: true,
    json: getInRange(target, keyName),
    fileName,
    keyName,
  });
}

function getInRange(json, keyName) {
  const keys = Object.keys(json);
  const isArray = Array.isArray(json);
  const croppedJsonData = {};

  let start = 0;
  let end = keys.length;

  if (end > objects_per_page) {
    if (!objects_pages[keyName]) objects_pages[keyName] = 0;

    start = objects_pages[keyName]++ * objects_per_page;
    end = start + objects_per_page;
  }

  for (let key of keys.slice(start, end)) {
    const value = json[key];
    const nextKey = keyName + ":" + key;
    key = isArray ? `isArray_${key}` : key;

    if (typeof value === "object" && value !== null) {
      croppedJsonData[key] = getInRange(value, nextKey);
    } else {
      croppedJsonData[key] = value;
    }
  }

  if (keys.length > end) {
    croppedJsonData["..."] = keyName;
  }

  return croppedJsonData;
}
