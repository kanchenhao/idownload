window.onload = onWindowLoad;

function onWindowLoad() {
  var message = document.querySelector("#message");
  chrome.tabs.executeScript(
    null,
    {
      file: "getPagesSource.js",
    },
    function () {
      // If you try and inject into an extensions page or the webstore/NTP you'll get an error
      if (chrome.runtime.lastError) {
        // message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
        message.innerText = "Not available in this website!";
      }
    }
  );
}

chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.action == "getSource") {
    message.innerText = "";
    var reqs = request.source;
    // if (reqs == "0") {
    if (reqs == null) {
      message.innerText = "No book can be downloaded!";
    } else {
      doAll(reqs);

      function getBlob(urlIn, domIn) {
        return new Promise((resolve) => {
          getInnerBlob(urlIn, domIn);

          function getInnerBlob(url, dom, fileType = ".pdf") {
            let that = this;
            let xhr = new XMLHttpRequest();
            let urlSplit = url.split("/");
            let bookId =
              "&bookId=" + urlSplit[urlSplit.length - 1].split(".")[0];
            xhr.open("GET", url + bookId, true);
            xhr.responseType = "blob";
            xhr.send();

            let dlProgress = document.createElement("div");
            dlProgress.setAttribute("class", "dl-progress");
            let spanDiv = document.createElement("span");
            dlProgress.appendChild(spanDiv);
            dom.appendChild(dlProgress);

            // Monitor download progress events
            xhr.addEventListener(
              "progress",
              function (e) {
                // if (e.lengthComputable) {
                //   let percentComplete = e.loaded / e.total;
                //   console.log(percentComplete)
                //   that.percentage = percentComplete * 100;
                //   spanDiv.style.width = that.percentage + "%";
                // }
                var eTotal;
                if (e.loaded) {
                  if (e.currentTarget.response) {
                    eTotal = e.total;
                  } else {
                    eTotal = e.loaded + 10e5;
                  }
                  let percentComplete = e.loaded / eTotal;
                  that.percentage = percentComplete * 100;
                  spanDiv.style.width = that.percentage + "%";
                }
              },
              false
            );

            xhr.onload = () => {
              if (xhr.response.size === 0) {
                console.log(url);
                if (url.substring(url.length - 3, url.length) == "cdf") {
                  url = url.substring(0, url.length - 3) + "epub";
                  dom.removeChild(dlProgress);
                  getInnerBlob(url, dom, ".epub");
                } else {
                  console.log("error 404");
                }
              } else if (xhr.status === 200) {
                // fileSize = (xhr.response.size / (1024 * 1024)).toFixed(2)
                // console.log(fileSize + 'M');
                resolve([xhr.response, fileType]);
              }
            };
          }
        });
      }

      function saveAs(blob, filename) {
        if (window.navigator.msSaveOrOpenBlob) {
          navigator.msSaveBlob(blob, filename);
        } else {
          const link = document.createElement("a");
          const body = document.querySelector("body");
          link.href = window.URL.createObjectURL(blob);
          link.download = filename;
          // fix Firefox
          link.style.display = "none";
          body.appendChild(link);
          link.click();
          body.removeChild(link);
          window.URL.revokeObjectURL(link.href);
        }
      }

      function doAll(res) {
        var resReg = /(\/batch|\/img)\/[\/]?.*?(?=.jpg|.png)/i;
        for (let i = 0; i < res.length; i++) {
          let resI = res[i].match(resReg)[0].replace("//", "/"); // replace '//' to '/' in some case
          let imgType = res[i].slice(res[i].length - 4, res[i].length);

          let resSplit = resI.split("/");
          let webSite = resSplit[1] == "batch" ? "itextbook" : "iresearchbook";
          let storePath = "/" + resSplit[2] + "/" + resSplit[3] + ".cdf";

          let listDiv = document.createElement("div");
          listDiv.id = "book-" + (i + 1);

          let bookCover = document.createElement("img");
          bookCover.setAttribute("class", "dl-image");
          bookCover.src = "https://www." + webSite + ".cn" + resI + imgType;
          listDiv.appendChild(bookCover);

          let dlBtn = document.createElement("a");
          let saveName = resSplit[3];
          dlBtn.className = "dl-link";
          // dlBtn.download = saveName;
          // dlBtn.href = 'https://www.' + webSite + '.cn/f/cdf/file?file=' + storePath
          let downloadUrl = "https://www." + webSite + ".cn/f/cdf/file?file=" + storePath;
          dlBtn.href = "javascript:void(0);";
          dlBtn.innerText = "Download Book";
          listDiv.appendChild(dlBtn);

          dlBtn.addEventListener("click", function () {
            getBlob(downloadUrl, listDiv).then(([blob, fileType]) => {
              saveAs(blob, saveName + fileType);
              listDiv.removeChild(listDiv.children[2]);
            });
          });

          message.appendChild(listDiv);
        }
      }
    }
  }
});
