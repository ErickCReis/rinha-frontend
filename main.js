const homePage = document.getElementById("home_page");
const resultPage = document.getElementById("result_page");

const input = document.getElementById("input");
const loading = document.getElementById("loading");
const error = document.getElementById("error");

const title = document.getElementById("title");
const result = document.getElementById("result");
const more = document.getElementById("more");

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

  const target = result.querySelector(
    `[data-key-name="${keyName}"]`
  )?.parentElement;

  if (!target) return;

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

const intersectorObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    worker.postMessage({
      type: "more",
    });
  }
});

intersectorObserver.observe(more);

function createStructure(json) {
  const keys = Object.keys(json);

  const ul = document.createElement("ul");

  for (let key of keys) {
    const li = document.createElement("li");
    const span = document.createElement("span");

    span.classList.add("key");
    span.textContent = key + ":";

    li.appendChild(span);

    const value = json[key];

    if (key === "...") {
      li.appendChild(createLoadMoreButton(value));
      ul.appendChild(li);
      continue;
    }

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
      if (Array.isArray(value)) {
        li.classList.add("array");
      }

      li.appendChild(createStructure(value));
    }

    ul.appendChild(li);
  }

  return ul;
}

function createLoadMoreButton(keyName) {
  const button = document.createElement("button");
  button.textContent = keyName;
  button.dataset.keyName = keyName;
  button.addEventListener("click", (e) => {
    const keyName = e.target.dataset.keyName;

    worker.postMessage({
      type: "more",
      keyName,
    });
  });

  return button;
}
