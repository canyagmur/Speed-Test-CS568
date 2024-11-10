// Initialize socket and other variables
const socket = io();
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

// Separate arrays for storing download and upload results
let downloadResults = [];
let uploadResults = [];
let pingResults = [];

let maxDownload;
let avgDownload;
let maxUpload;
let avgUpload;



// Function to start the test
function startTest() {
  const startBtn = document.getElementById("start-button");
  startBtn.innerText = "Stop Test!";
  startBtn.onclick = () => location.reload(); // Stop the test if "Stop Test!" is clicked

  // Reset all variables
  dataDownloaded = 0;
  dataUploaded = 0;

  // Reset displayed values in the bubbles
  document.getElementById("ping").textContent = "0 ms";
  document.getElementById("download").textContent = "0 Mbps";
  document.getElementById("datadown").textContent = "0 MB";
  document.getElementById("upload").textContent = "0 Mbps";
  document.getElementById("datauploaded").textContent = "0 MB";

  startPing();
}

// Initialize ping test
function startPing() {
  document.getElementById("ping").textContent = "";
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
  pingResults.push(latency);

  if (pingResults.length === 15) {
    let result = Math.min.apply(null, pingResults);
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
  downloadResults.push(result);

  let downloadElem = document.getElementById("download");
  let downloadedData = document.getElementById("datadown");

  maxDownload = Math.max(...downloadResults);
  avgDownload = downloadResults.reduce((a, b) => a + b, 0) / downloadResults.length;
  
  downloadElem.innerHTML = `Max: ${rounded(maxDownload)} Mbps<br>Avg: ${rounded(avgDownload)} Mbps`;

  if (Date.now() - downloadStart > 1000 * DOWNLOAD_TIME_SEC) {
    startUpload();
  } else {
    chunkSize = calcChunk(result);
    dataDownloaded += chunkSize;
    downloadedData.innerHTML = `${rounded(dataDownloaded * 0.000000125).toFixed(2)} MB`;
    download();
  }
});

// Upload section
let dataUploaded = 0;
socket.on("upload", function () {
  let elapsed = (Date.now() - requestStart) / 1000;
  let sent = (chunkSize * 8) / 1024 / 1024;
  let result = sent / elapsed;
  uploadResults.push(result);

  let uploadElem = document.getElementById("upload");
  let uploadedData = document.getElementById("datauploaded");

  maxUpload = Math.max(...uploadResults);
  avgUpload = uploadResults.reduce((a, b) => a + b, 0) / uploadResults.length;

  uploadElem.innerHTML = `Max: ${rounded(maxUpload)} Mbps<br>Avg: ${rounded(avgUpload)} Mbps`;

  if (Date.now() - uploadStart > UPLOAD_TIME_SEC * 1000) {
    // Update button to "RUN AGAIN"
    const startBtn = document.getElementById("start-button");
    startBtn.innerText = "RUN AGAIN";

    let today = new Date();
    let date =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate() +
      " " +
      today.getHours() +
      ":" +
      today.getMinutes();

    // Save results to testResults
    testResults.downloads.push(`Max: ${rounded(maxDownload)} Mbps / Avg: ${rounded(avgDownload)} Mbps`);
    testResults.uploads.push(`Max: ${rounded(maxUpload)} Mbps / Avg: ${rounded(avgUpload)} Mbps`);
    testResults.pings.push(document.getElementById("ping").innerText);
    testResults.downloadSizes.push(document.getElementById("datadown").innerText);
    testResults.uploadSizes.push(uploadedData.innerText);
    testResults.dates.push(date);

    document.getElementById("tbody").innerHTML = renderTable();

    startBtn.onclick = startTest;
  } else {
    chunkSize = calcChunk(result);
    dataUploaded += chunkSize;
    uploadedData.innerHTML = `${rounded(dataUploaded * 0.000000125).toFixed(2)} MB`;
    upload();
  }
});

// Render the results table
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

// Utility functions
function rounded(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function calcChunk(data) {
  return (data * 1024 * 1024) / 8;
}

function randomBytes(size) {
  let str = "";
  for (let i = 0; i < size; i++) {
    let randByte = parseInt(Math.random() * 256, 10).toString(16);
    if (randByte.length == 1) randByte = "0" + randByte;
    str += randByte;
  }
  return str;
}

function startDownload() {
  document.getElementById("download").innerHTML = "";
  downloadResults = []; // Clear download results before starting
  chunkSize = startChunkSize;
  downloadStart = Date.now();
  download();
}

function startUpload() {
  document.getElementById("upload").innerHTML = "";
  uploadResults = []; // Clear upload results before starting
  chunkSize = startChunkSize;
  uploadStart = Date.now();
  upload();
}
