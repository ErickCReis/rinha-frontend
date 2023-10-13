let fileName = null;
let json = null;
let hasMore = true;

const objects_per_page = 20;
const objects_pages = {};

onmessage = ({ data }) => {
  if (data.type === "load") {
    load(data.file);
  }

  if (data.type === "more") {
    next(data.keyName);
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
  const croppedJsonData = {};

  for (let key of keys.slice(start, end)) {
    const value = json[key];

    if (typeof value === "object" && value !== null) {
      const keysLength = Object.keys(value).length;
      const newKeyName = keyName + ":" + key;

      croppedJsonData[key] = getInRange(value, newKeyName);

      if (keysLength > objects_per_page) {
        croppedJsonData[key]["..."] = newKeyName;
      }
    } else {
      croppedJsonData[key] = value;
    }
  }

  if (keyName !== "root" && keys.length > end) {
    croppedJsonData["..."] = keyName;
  }

  return croppedJsonData;
}
