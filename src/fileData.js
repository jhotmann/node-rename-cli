const exif = require('jpeg-exif');
const os = require('os');
const MP3Tag = require('mp3tag.js');
const path = require('path');
const pathExists = require('path-exists');
const fs = require('fs-extra');

let userData;
if (pathExists.sync(os.homedir() + '/.rename/userData.js')) {
  userData = require(os.homedir() + '/.rename/userData.js');
} else {
  userData = function() { return {}; };
}

module.exports.FileData = class FileData {
  constructor(input, options) {
    this.options = options;
    this.parsedPath = path.parse(input);
    this.userData = userData(input);
    this.stats = getFileStats(input);
    this.now = new Date();
  }

  async get() {
    let exifData = getExifData(this.parsedPath.dir + '/' + this.parsedPath.base);
    let tags = {};
    if (!this.stats.isDirectory()) {
      const buffer = await fs.readFile(this.parsedPath.dir + '/' + this.parsedPath.base);
      const mp3tag = new MP3Tag(buffer, false);
      await mp3tag.read();
      if (mp3tag.errorCode === -1) tags = mp3tag.tags;
    }

    const defaultData = {
      i: this.options.noIndex ? '' : '--FILEINDEXHERE--',
      f: this.parsedPath.name,
      fileName: this.parsedPath.name,
      ext: this.parsedPath.ext,
      isDirectory: this.stats.isDirectory(),
      p: path.basename(this.parsedPath.dir),
      parent: path.basename(this.parsedPath.dir),
      date: {
        current: this.now,
        now: this.now,
        create: this.stats.birthtime || '',
        modify: this.stats.mtime || '',
        access: this.stats.atime || '',
      },
      os: {
        homedir: os.homedir(),
        platform: os.platform(),
        hostname: os.hostname(),
        user: os.userInfo().username
      },
      guid: createGuid(),
      customGuid: (format) => { return createGuid(format); },
      stats: this.stats,
      parsedPath: this.parsedPath,
      exif: {
        iso: (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.PhotographicSensitivity ? exifData.SubExif.PhotographicSensitivity : ''),
        fnum: (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.FNumber ? exifData.SubExif.FNumber : ''),
        exposure: (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.ExposureTime ? exifData.SubExif.ExposureTime : ''),
        date: (typeof(exifData) === 'object' && exifData.DateTime ? exifData.DateTime.split(/:|\s/)[1] : ''),
        width: (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.PixelXDimension ? exifData.SubExif.PixelXDimension : ''),
        height: (typeof(exifData) === 'object' && exifData.SubExif && exifData.SubExif.PixelYDimension ? exifData.SubExif.PixelYDimension : '')
      },
      id3: {
        title: tags.title || '',
        artist: tags.artist || '',
        album: tags.album || '',
        year: tags.year || '',
        track: tags.track || '',
        totalTracks: (tags.TRCK  && tags.TRCK.split('/')[1]) || ''
      }
    };
    return Object.assign(defaultData, this.userData);
  }

  getDescriptions() {
    const defaultDescriptions = {
      i: 'Override where the file index will go if there are multiple files being named the same thing. By default it is appended to the end of the file name.',
      f: 'The original name of the file. Alias: fileName',
      ext: 'The original file extension of the file',
      isDirectory: 'true if the current input is a directory, false otherwise',
      p: 'The name of the parent directory. Alias: parent',
      date: {
        current: 'The current date/time. Alias: now',
        create: 'The date/time the file was created',
        modify: 'The date/time the file was last modified',
        access: 'The date/time the file was last accessed'
      },
      os: {
        homedir: `The path to the current user's home directory`,
        platform: `The operating system platform: 'darwin', 'linux', or 'windows'`,
        user: 'The username of the current user'
      },
      guid: 'A pseudo-random guid',
      stats: `All the input file's stats https://nodejs.org/api/fs.html#fs_class_fs_stats`,
      parsedPath: `The file's parsed path https://nodejs.org/api/path.html#path_path_parse_path`,
      exif: {
        iso: 'The ISO sensitivity of the camera when the photo was taken',
        fnum: 'The F-stop number of the camera when the photo was taken',
        exposure: 'The exposure time of the camera when the photo was taken. Use the fraction filter to convert decimals to fractions',
        date: 'The date on the camera when the photo was taken',
        width: 'The pixel width of the photo',
        height: 'The pixel height of the photo'
      },
      id3: {
        title: 'The title of the song',
        artist: 'The artist of the song',
        album: 'The album of the song',
        year: 'The year of the song',
        track: 'The track number of the song',
        totalTracks: 'The number of tracks on the album'
      }
    };
    return Object.assign(defaultDescriptions, userData(null, true));
  }
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

function getFileStats(file) {
  if (fs.existsSync(file)) {
    return fs.lstatSync(file);
  } else {
    return {
      isDirectory: function() { return false; },
      birthtime: '',
      mtime: '',
      ctime: '',
      atime: ''
    };
  }
}