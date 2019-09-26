// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
let userImageBase = '';
const fs = require('electron').remote.require('fs');
const gm = require('electron').remote.require('gm').subClass({imageMagick: true});

function run() {
  const {dialog} = require('electron').remote
  let filePath = null;


  document.getElementById('upload_file').addEventListener('click', () => {
    dialog.showOpenDialog({ properties: [ 'openFile', 'multiSelections' ]})
    .then(result => {
      console.log('result.canceled', result.canceled);
      console.log('result.filePaths', result.filePaths)
      if (result.filePaths) {
        userImageBase = fileToBuffer(result.filePaths[0]);
        readFile(userImageBase);
      }
    });
  })

  document.getElementById('resize_file').addEventListener('click', () => {
    if(userImageBase) {
      resizeObject(userImageBase);
    }
  });

  document.getElementById('save_file').addEventListener('click', () => {
    const selectedColor = document.getElementById('color_file').value;
    const data = gm(new Buffer(userImageBase), 'base64').fill(selectedColor).opaque('black');
    gmToBuffer(data)
    .then(function(buffer) {
      userImageBase = buffer;
    })
    .catch(e => console.log(e));
    dialog.showSaveDialog({}, function(file_path) {
      if (file_path) {
        fs.writeFile(file_path, userImageBase, 'base64', function(err) {
          console.log(err);
        });
      }
    });
  });

  document.getElementById('color_file').addEventListener('change', () => {
    if(userImageBase) {
      colorFile(userImageBase);
    }
  });
}


function gmToBuffer (data) {
  return new Promise((resolve, reject) => {
    data.stream((err, stdout, stderr) => {
      if (err) { return reject(err) }
      const chunks = []
      stdout.on('data', (chunk) => { chunks.push(chunk) })
      // these are 'once' because they can and do fire multiple times for multiple errors,
      // but this is a promise so you'll have to deal with them one at a time
      stdout.once('end', () => { resolve(Buffer.concat(chunks)) })
      stderr.once('data', (data) => { reject(String(data)) })
    })
  })
}

function fileToBuffer(file) {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap);
}

function readFile(fileName) {
  const img = fileName.toString('base64');
  const element = document.getElementById('img');
  const imgInsert = document.createElement('img');
  imgInsert.id = 'file';
  element.innerHTML = '';
  imgInsert.src = `data:image/png;base64,${img}`;
  element.appendChild(imgInsert);
}

function resizeObject(fileName) {
  const width = document.getElementById('resize_width').value;
  const height = document.getElementById('resize_height').value;
  const data = gm(new Buffer(fileName), 'base64').resizeExact(width, height);
  gmToBuffer(data)
  .then(function(buffer) {
    userImageBase = buffer;
    imgToDisplay = userImageBase.toString('base64');
    const element = document.getElementById('img');
    const imgResized = document.createElement('img');
    imgResized.id = 'file'
    element.innerHTML = '';
    imgResized.src = `data:image/png;base64,${imgToDisplay}`
    element.appendChild(imgResized);
  })
  .catch(e => console.log(e));
}

function colorFile(fileName) {
  const color = document.getElementById('color_file').value;
  console.log('color', color);
  const el = document.getElementById('file')
  el.style.backgroundColor = color;
}



window.addEventListener('DOMContentLoaded', () => run())

