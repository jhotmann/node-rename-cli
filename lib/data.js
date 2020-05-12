const exif = require('jpeg-exif');
const fs = require('fs-extra');
const MP3Tag = require('mp3tag.js');
const os = require('os');
const path = require('path');

module.exports = function(fileObj, descriptions) {
  const STATS = fs.statSync(fileObj.dir + '/' + fileObj.base, {bigint: true});

  let returnData = {};
  let returnDescriptions = {};

  returnData.i = fileObj.options && fileObj.options.noIndex ? '' : '--FILEINDEXHERE--';
  returnDescriptions.i = 'Override where the file index will go if there are multiple files being named the same thing. By default it is appended to the end of the file name.';
  
  returnData.f = fileObj.name;
  returnData.fileName = returnData.f;
  returnDescriptions.f = 'The original name of the file. Alias: fileName';

  returnData.ext = fileObj.ext.replace(/^\./, '');
  returnDescriptions.ext = 'The original file extension of the file';

  returnData.isDirectory = fileObj.isDirectory;
  returnDescriptions.isDirectory = 'True if the current input is a directory, false otherwise';

  returnData.p = path.basename(fileObj.dir);
  returnData.parent = returnData.p;
  returnDescriptions.p = 'The name of the parent directory. Alias: parent';

  returnData.date = {};
  returnDescriptions.date = {};
  returnData.date.current = new Date();
  returnData.now = returnData.date.current;
  returnDescriptions.date.current = 'The current date/time. Alias: now';
  returnData.date.create = STATS.birthtime || '';
  returnDescriptions.date.create = 'The date/time the file was created';
  returnData.date.modify = STATS.mtime || '';
  returnDescriptions.date.modify = 'The date/time the file was last modified';
  returnData.date.access = STATS.atime || '';
  returnDescriptions.date.access = 'The date/time the file was last accessed';

  returnData.os = {};
  returnDescriptions.os = {};
  returnData.os.homedir = os.homedir();
  returnDescriptions.os.homedir = 'The path to the current user\'s home directory';
  returnData.os.hostname = os.hostname();
  returnDescriptions.os.hostname = 'The hostname of the computer';
  returnData.os.platform = os.platform();
  returnDescriptions.os.platform = `The operating system platform: 'aix', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos', or 'win32'`;
  returnData.os.user = os.userInfo().username;
  returnDescriptions.os.user = 'The username of the current user';

  returnData.guid = createGuid();
  returnDescriptions.guid = 'A pseudo-random guid';
  returnData.customGuid = (format) => { return createGuid(format); };

  let exifData = getExifData(fileObj.dir + '/' + fileObj.base);
  returnData.exif = {};
  returnDescriptions.exif = {};
  returnData.exif.iso = (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.PhotographicSensitivity ? exifData.SubExif.PhotographicSensitivity : '');
  returnDescriptions.exif.iso = 'The ISO sensitivity of the camera when the photo was taken';
  returnData.exif.fnum = (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.FNumber ? exifData.SubExif.FNumber : '');
  returnDescriptions.exif.fnum = 'The F-stop number of the camera when the photo was taken';
  returnData.exif.exposure = (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.ExposureTime ? exifData.SubExif.ExposureTime : '');
  returnDescriptions.exif.exposure = 'The exposure time of the camera when the photo was taken. Use the fraction filter to convert decimals to fractions';
  returnData.exif.date = (typeof(exifData) === 'object' && exifData.DateTime ? exifData.DateTime.split(/:|\s/)[1] : '');
  returnDescriptions.exif.date = 'The date on the camera when the photo was taken';
  returnData.exif.width = (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.PixelXDimension ? exifData.SubExif.PixelXDimension : '');
  returnDescriptions.exif.width = 'The pixel width of the photo';
  returnData.exif.height = (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.PixelYDimension ? exifData.SubExif.PixelYDimension : '');
  returnDescriptions.exif.height = 'The pixel height of the photo';

  let tags = {};
  if (!STATS.isDirectory()) {
    const buffer = fs.readFileSync(fileObj.dir + '/' + fileObj.base);
    const mp3tag = new MP3Tag(buffer, false);
    mp3tag.read();
    if (mp3tag.errorCode === -1) tags = mp3tag.tags;
  }
  returnData.id3 = {};
  returnDescriptions.id3 = {};
  returnData.id3.title = tags.title || '';
  returnDescriptions.id3.title = 'The title of the song';
  returnData.id3.artist = tags.artist || '';
  returnDescriptions.id3.artist = 'The artist of the song';
  returnData.id3.album = tags.album || '';
  returnDescriptions.id3.album = 'The album the song is on';
  returnData.id3.year = tags.year || '';
  returnDescriptions.id3.year = 'The year of the song';
  returnData.id3.track = tags.track || '';
  returnDescriptions.id3.track = 'The track number of the song';
  returnData.id3.totalTracks = (tags.TRCK  && tags.TRCK.split('/')[1]) || '';
  returnDescriptions.id3.totalTracks = 'The number of tracks on the album';

  if (!descriptions) return returnData;
  else return returnDescriptions;
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
