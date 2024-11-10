// Initialize socket and other variables
const socket = io();
let results = [];
let requestStart;
let downloadStart;
let uploadStart;
let startChunkSize = 100000;
let chunkSize;
let junkData;

let DOWNLOAD_TIME_SEC = 10;
let UPLOAD_TIME_SEC = 10;

const testResults = {
  downloads: [],
  uploads: [],
  pings: [],
  downloadSizes: [],
  uploadSizes: [],
  dates: [],
};

// Function to start the test
function startTest() {
  const startBtn = document.getElementById("start-button");
  startBtn.innerText = "Stop Test!";
  startBtn.onclick = () => location.reload();

  dataDownloaded = 0;
  dataUploaded = 0;
  startPing();
}

// Initialize ping test
function startPing() {
  document.getElementById("ping").textContent = "";
  results = [];
  ping();
}

function ping() {
  setTimeout(function () {
    socket.emit("clientPing", Date.now());
  }, 50);
}

function download() {
  setTimeout(function () {
    requestStart = Date.now();
    socket.emit("download", chunkSize);
  }, 10);
}

function upload() {
  setTimeout(function () {
    let data = randomBytes(chunkSize);
    requestStart = Date.now();
    socket.emit("upload", data);
  }, 50);
}

// Handle server response for ping
socket.on("serverPong", function (data) {
  let latency = Date.now() - data;
  document.getElementById("ping").innerHTML = latency + " ms";
  results.push(latency);

  if (results.length === 15) {
    let result = Math.min.apply(null, results);
    document.getElementById("ping").innerHTML = result + " ms";
    startDownload();
  } else {
    ping();
  }
});

// Download section
let dataDownloaded = 0;
socket.on("download", function (data) {
  let elapsed = (Date.now() - requestStart) / 1000;
  let received = (data.byteLength * 8) / 1024 / 1024;
  let result = received / elapsed;
  junkData = data;
  results.push(result);

  let downloadElem = document.getElementById("download");
  let downloadedData = document.getElementById("datadown");

  downloadElem.innerHTML = rounded(result) + " Mbps";

  if (Date.now() - downloadStart > 1000 * DOWNLOAD_TIME_SEC) {
    let max = Math.max.apply(null, results);
    downloadElem.innerHTML = rounded(max) + " Mbps";
    startUpload();
  } else {
    chunkSize = calcChunk(result);
    dataDownloaded += chunkSize;
    downloadedData.innerHTML =
      rounded(rounded(dataDownloaded) * 0.000000125).toFixed(2) + " MB";
    download();
  }
});

// Upload section
let dataUploaded = 0;
socket.on("upload", function () {
  let elapsed = (Date.now() - requestStart) / 1000;
  let sent = (chunkSize * 8) / 1024 / 1024;
  let result = sent / elapsed;
  results.push(result);

  let uploadElem = document.getElementById("upload");
  let uploadedData = document.getElementById("datauploaded");
  let startBtn = document.getElementById("start-button");

  uploadElem.innerHTML = rounded(result) + " Mbps";

  if (Date.now() - uploadStart > UPLOAD_TIME_SEC * 1000) {
    let max = Math.max.apply(null, results);
    uploadElem.innerHTML = rounded(max) + " Mbps";

    startBtn.style.display = "block";
    startBtn.innerText = "RUN AGAIN";

    var today = new Date();
    var date =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate() +
      " " +
      today.getHours() +
      ":" +
      today.getMinutes();

    testResults.downloads.push(uploadElem.innerText);
    testResults.uploads.push(uploadElem.innerText);
    testResults.pings.push(document.getElementById("ping").innerText);
    testResults.downloadSizes.push(
      document.getElementById("datadown").innerText
    );
    testResults.uploadSizes.push(uploadedData.innerText);
    testResults.dates.push(date);

    document.getElementById("tbody").innerHTML = renderTable();

    startBtn.onclick = startTest;
  } else {
    chunkSize = calcChunk(result);
    dataUploaded += chunkSize;
    uploadedData.innerHTML =
    rounded(rounded(dataUploaded) * 0.000000125).toFixed(2) + " MB";
    upload();
  }
});

function renderTable() {
  let str = "";
  for (let i = 0; i < testResults.downloads.length; i++) {
    str += `
            <tr>
                <td>${testResults.downloads[i]}</td>
                <td>${testResults.uploads[i]}</td>
                <td>${testResults.pings[i]}</td>
                <td>${testResults.dates[i]}</td>
            </tr>
        `;
  }
  return str;
}

function rounded(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function calcChunk(data) {
  return (data * 1024 * 1024) / 8;
}

function randomBytes(size) {
  var str = "";
  for (var i = 0; i < size; i++) {
    var randByte = parseInt(Math.random() * 256, 10);
    randByte = randByte.toString(16);
    if (randByte.length == 1) {
      randByte = "0" + randByte;
    }
    str += randByte;
  }
  return str;
}

function startDownload() {
  document.getElementById("download").innerHTML = "";
  results = [];
  chunkSize = startChunkSize;
  downloadStart = Date.now();
  download();
}

function startUpload() {
  document.getElementById("upload").innerHTML = "";
  results = [];
  chunkSize = startChunkSize;
  uploadStart = Date.now();
  upload();
}
