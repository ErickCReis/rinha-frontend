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
  if (!objects_pages[keyName]) objects_pages[keyName] = 0;

  const start = objects_pages[keyName] * objects_per_page;
  const end = ++objects_pages[keyName] * objects_per_page;

  const keys = Object.keys(json);
  const isArray = Array.isArray(json);
  const croppedJsonData = isArray ? [] : {};

  for (let key of keys.slice(start, end)) {
    const value = json[key];

    if (typeof value === "object" && value !== null) {
      const keysLength = Object.keys(value).length;
      const newKeyName = keyName + ":" + key;

      const data = getInRange(value, newKeyName);
      if (isArray) {
        croppedJsonData.push(data);
      } else {
        croppedJsonData[key] = data;
      }

      if (keysLength > objects_per_page) {
        if (isArray) {
          croppedJsonData.push("addload_" + newKeyName);
        } else {
          croppedJsonData[key]["..."] = newKeyName;
        }
      }
    } else {
      if (isArray) {
        croppedJsonData.push(value);
      } else {
        croppedJsonData[key] = value;
      }
    }
  }

  if (keys.length > end) {
    if (isArray) {
      croppedJsonData.push("addload_" + keyName);
    } else {
      croppedJsonData["..."] = keyName;
    }
  }

  return croppedJsonData;
}
