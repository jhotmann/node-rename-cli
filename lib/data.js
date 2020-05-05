const exif = require('jpeg-exif');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

module.exports = function(fileObj) {
  const STATS = fs.statSync(fileObj.dir + '/' + fileObj.base, {bigint: true});

  let returnData = {};

  returnData.i = fileObj.options && fileObj.options.noIndex ? '' : '--FILEINDEXHERE--';
  
  returnData.f = fileObj.name;
  returnData.fileName = returnData.f;

  returnData.p = path.basename(fileObj.dir);

  returnData.date = {};
  returnData.date.current = new Date();
  returnData.date.now = returnData.date.current;
  returnData.date.create = STATS.birthtime || '';
  returnData.date.modify = STATS.mtime || '';
  returnData.date.access = STATS.atime || '';

  returnData.os = {};
  returnData.os.homedir = os.homedir();
  returnData.os.hostname = os.hostname();
  returnData.os.platform = os.platform();
  returnData.os.user = os.userInfo().username;

  returnData.guid = createGuid();
  returnData.customGuid = (format) => { return createGuid(format); };

  let exifData = getExifData(fileObj.dir + '/' + fileObj.base);
  returnData.exif = {};
  returnData.exif.iso = (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.PhotographicSensitivity ? exifData.SubExif.PhotographicSensitivity : '');
  returnData.exif.fnum = (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.FNumber ? exifData.SubExif.FNumber : '');
  returnData.exif.exposure = (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.ExposureTime ? exifData.SubExif.ExposureTime : '');
  returnData.exif.date = (typeof(exifData) === 'object' && exifData.DateTime ? exifData.DateTime.split(/:|\s/)[1] : '');
  returnData.exif.width = (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.PixelXDimension ? exifData.SubExif.PixelXDimension : '');
  returnData.exif.height = (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.PixelYDimension ? exifData.SubExif.PixelYDimension : '');

  return returnData;
};

function createGuid(format) {
  format = format || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return format.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
}

function getExifData(file) {
  try {
    let data = exif.parseSync(file);
    return data;
  } catch (ex) {
    return '';
  }
}
