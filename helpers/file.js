const fs = require("fs");
const shell = require("shelljs");

const createDir = (path) => {
  if (!fs.existsSync(path)) {
    shell.mkdir("-p", path);
  }
};

const createFile = async (path, content) => {
  let result;
  try {
    result = await new Promise((resolve, reject) => {
      fs.writeFile(path, content, (err) => {
        if (err) reject(false);
        resolve(true);
      });
    });
  } catch (err) {
    console.log(err);
  }
  return result;
};
const createFileBase64 = (folder, folder_return, fileBase64, ext) => {
  try {
    var rdm = Math.floor(1000 + Math.random() * 9000);
    const base64Data = fileBase64.split(",").pop();
    let buff = Buffer.from(base64Data, "base64");
    let nama_file = rdm + "_" + Date.now() + "." + ext;
    fs.writeFileSync(folder + nama_file, buff);
    return folder_return + nama_file;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { createDir, createFile, createFileBase64 };
