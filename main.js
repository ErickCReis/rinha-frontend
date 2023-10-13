const homePage = document.getElementById("home_page");
const resultPage = document.getElementById("result_page");

const input = document.getElementById("input");
const error = document.getElementById("error");

const back = document.getElementById("back");
const title = document.getElementById("title");
const result = document.getElementById("result");

const worker = new Worker("./worker.js");
worker.addEventListener("message", ({ data }) => {
  handleMessage(data);
});

function handleMessage(data) {
  const { isValid, json, fileName, keyName } = data;

  if (!isValid) {
    error.textContent = "Invalid file. Please load a valid JSON file.";
    return;
  }

  homePage.style.display = "none";
  resultPage.style.display = "block";

  title.textContent = fileName;

  if (keyName === "root") {
    result.appendChild(createStructure(json));
    return;
  }

  let target = document.getElementById(keyName);
  if (!target) return;

  intersectorObserver.unobserve(target);
  target = target.parentElement;

  target.innerHTML = "";
  const res = createStructure(json);
  const resCount = res.childElementCount;

  for (let i = 0; i < resCount; i++) {
    target.appendChild(res.children.item(0));
  }
}

input.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  worker.postMessage({
    type: "load",
    file,
  });
});

back.addEventListener("click", () => {
  homePage.style.display = "flex";
  resultPage.style.display = "none";

  result.innerHTML = "";
  input.value = "";
  error.innerHTML = "&nbsp;";

  worker.postMessage({
    type: "reset",
  });
});

const intersectorObserver = new IntersectionObserver((entries) => {
  for (let entry of entries) {
    if (entry.isIntersecting || entry.isVisible) {
      worker.postMessage({
        type: "more",
        keyName: entry.target.id,
      });
    }
  }
});

function createStructure(json) {
  const keys = Object.keys(json);

  const ul = document.createElement("ul");

  for (let key of keys) {
    const value = json[key];
    let isArray = false;
    if (key.startsWith("isArray_")) {
      isArray = true;
      key = key.slice(8);
    }

    const li = document.createElement("li");

    if (key === "...") {
      li.appendChild(createLoadMoreRef(value));
      ul.appendChild(li);
      continue;
    }

    const span = document.createElement("span");

    span.classList.add("key");
    span.textContent = key + ":";

    li.appendChild(span);

    if (value === null || typeof value !== "object") {
      const span = document.createElement("span");
      span.classList.add("value");

      if (value === null) {
        span.textContent = "null";
      } else if (typeof value === "string") {
        span.textContent = `"${value}"`;
      } else {
        span.textContent = value;
      }

      li.appendChild(span);
    } else {
      li.appendChild(createStructure(value));
    }

    if (isArray) {
      ul.classList.add("array");
    }
    ul.appendChild(li);
  }

  return ul;
}

function createLoadMoreRef(keyName) {
  const div = document.createElement("div");
  div.id = keyName;

  intersectorObserver.observe(div);

  return div;
}
