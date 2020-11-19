const async = require('async');
const download = require('download');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const yargs = require('yargs');

const database = require('./src/database');
const yargsOptions = require('./lib/yargsOptions');

const { Batch } = require('./src/batch');

let SEQUELIZE;

beforeAll(async () => {
  // remove test directory
  await fs.remove('./test');
  // create test files/directories
  await fs.ensureDir('test');
  await fs.ensureDir('test/another-dir');
  await async.times(31, async (i) => {
    if (i === 0) return;
    let num = inWords(i);
    let dir = `${i < 20 ? 'test/' : 'test/another-dir/'}`;
    let fileName = `${num.trim().replace(' ', '-')}.txt`;
    await fs.writeFile(`${dir}${fileName}`, `file ${num.trim()}`, 'utf8');
  });
  SEQUELIZE = await database.initTest();
});

describe('Rename a single file: rename test/one.txt test/one-renamed.txt', () => {
  const oldFiles = ['test/one.txt'];
  const newFiles = ['test/one-renamed.txt'];
  let originalContent;
  beforeAll(async () => {
    originalContent = await fs.readFile('test/one.txt', 'utf8');
    await runCommand('rename test/one.txt test/one-renamed.txt');
  });
  test(`Old files don't exist`, async () => {
    const result = await async.every(oldFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(false);
  });
  test(`New files do exist`, async () => {
    const result = await async.every(newFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(true);
  });
  test(`New file has correct content`, async () => {
    const result = await fs.readFile('test/one-renamed.txt', 'utf8');
    expect(result).toBe(originalContent);
  });
});

describe('Rename multiple files the same thing with appended index: rename test/f*.txt test/multiple', () => {
  const oldFiles = ['test/four.txt', 'test/five.txt', 'test/fourteen.txt', 'test/fifteen.txt'];
  const newFiles = ['test/multiple1.txt', 'test/multiple2.txt', 'test/multiple3.txt', 'test/multiple4.txt'];
  beforeAll(async () => {
    await runCommand('rename test/f*.txt test/multiple');
  });
  test(`Old files don't exist`, async () => {
    const result = await async.every(oldFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(false);
  });
  test(`New files do exist`, async () => {
    const result = await async.every(newFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(true);
  });
});

describe('Rename multiple files the same thing with appended index and file extension specified and sort option: rename test/multiple* test/twelve.txt test/multiple.log', () => {
  const oldFiles = ['test/multiple1.txt', 'test/multiple2.txt', 'test/multiple3.txt', 'test/multiple4.txt', 'test/twelve.txt'];
  const newFiles = ['test/multiple1.log', 'test/multiple2.log', 'test/multiple3.log', 'test/multiple4.log', 'test/multiple5.log'];
  let originalContent;
  beforeAll(async () => {
    originalContent = await fs.readFile('test/twelve.txt', 'utf8');
    await runCommand('rename --sort reverse-alphabet test/multiple* test/twelve.txt test/multiple.log');
  });
  test(`Old files don't exist`, async () => {
    const result = await async.every(oldFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(false);
  });
  test(`New files do exist`, async () => {
    const result = await async.every(newFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(true);
  });
  test(`New file has correct content`, async () => {
    const result = await fs.readFile('test/multiple1.log', 'utf8');
    expect(result).toBe(originalContent);
  });
});

describe('Rename with variables and filters: rename test/two.txt "{{p}}/{{f|upper}}.{{\'testing-stuff\'|camel}}"', () => {
  const oldFiles = ['test/two.txt'];
  const newFiles = ['test/TWO.testingStuff'];
  beforeAll(async () => {
    await runCommand(`rename test/two.txt "{{p}}/{{f|upper}}.{{'testing-stuff'|camel}}"`);
  });
  test(`Old files don't exist`, async () => {
    const result = await async.every(oldFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(false);
  });
  test(`New files do exist`, async () => {
    const result = await async.every(newFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(true);
  });
  test(`New files has correct case`, async () => {
    const files = await fs.readdir('test');
    expect(files.indexOf('TWO.testingStuff')).toBeGreaterThan(-1);
  });
});

describe('Force multiple files to be renamed the same: rename test/th* test/same --noindex -force', () => {
  const oldFiles = ['test/three.txt', 'test/thirteen.txt'];
  const newFiles = ['test/same.txt'];
  beforeAll(async () => {
    await runCommand('rename test/th* test/same --noindex -force');
  });
  test(`Old files don't exist`, async () => {
    const result = await async.every(oldFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(false);
  });
  test(`New files do exist`, async () => {
    const result = await async.every(newFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(true);
  });
  test(`New file has correct content`, async () => {
    const result = await fs.readFile('test/same.txt', 'utf8');
    expect(result).toMatch(/^file three.*/);
  });
});

describe('Multiple files to be renamed the same but with keep option: rename test/six* test/keep --noindex -k', () => {
  const oldFiles = ['test/six.txt', 'test/sixteen.txt'];
  const newFiles = ['test/keep.txt', 'test/keep-1.txt'];
  beforeAll(async () => {
    await runCommand('rename test/six* test/keep --noindex -k');
  });
  test(`Old files don't exist`, async () => {
    const result = await async.every(oldFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(false);
  });
  test(`New files do exist`, async () => {
    const result = await async.every(newFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(true);
  });
});

describe('Move a file to a new directory: rename test/one-renamed.txt "test/another-dir/{{os.platform}}"', () => {
  const oldFiles = ['test/one-renamed.txt'];
  const newFiles = [`test/another-dir/${os.platform()}.txt`];
  beforeAll(async () => {
    await runCommand('rename test/one-renamed.txt "test/another-dir/{{os.platform}}"');
  });
  test(`Old files don't exist`, async () => {
    const result = await async.every(oldFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(false);
  });
  test(`New files do exist`, async () => {
    const result = await async.every(newFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(true);
  });
});

describe(`Don't move a file to a new directory: rename test/eight.txt "test/another-dir/{{f}}-notmoved" --nomove`, () => {
  const oldFiles = ['test/eight.txt'];
  const newFiles = ['test/eight-notmoved.txt'];
  beforeAll(async () => {
    await runCommand('rename test/eight.txt "test/another-dir/{{f}}-notmoved" --nomove');
  });
  test(`Old files don't exist`, async () => {
    const result = await async.every(oldFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(false);
  });
  test(`New files do exist`, async () => {
    const result = await async.every(newFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(true);
  });
});

describe(`Rename multiple files to the same date and append index: rename --nomove test/seven* "{{ date.current | date('YYYY-MM-DD') }}"`, () => {
  const now = new Date();
  const nowFormatted = `${now.getFullYear()}-${now.getMonth() < 9 ? '0' : ''}${now.getMonth() + 1}-${now.getDate() < 10 ? '0' : ''}${now.getDate()}`;
  const oldFiles = ['test/seven.txt', 'test/seventeen.txt'];
  const newFiles = [`test/${nowFormatted}1.txt`, `test/${nowFormatted}2.txt`];
  beforeAll(async () => {
    await runCommand(`rename --nomove test/seven* "{{ date.current | date('YYYY-MM-DD') }}"`);
  });
  test(`Old files don't exist`, async () => {
    const result = await async.every(oldFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(false);
  });
  test(`New files do exist`, async () => {
    const result = await async.every(newFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(true);
  });
});

describe(`Test --noext option: rename test/ten.txt "test/asdf{{os.user}}" --noext`, () => {
  const oldFiles = ['test/ten.txt'];
  const newFiles = [`test/asdf${os.userInfo().username}`];
  beforeAll(async () => {
    await runCommand('rename test/ten.txt "test/asdf{{os.user}}" --noext', true);
  });
  test(`Old files don't exist`, async () => {
    const result = await async.every(oldFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(false);
  });
  test(`New files do exist`, async () => {
    const result = await async.every(newFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(true);
  });
});

describe(`Test undo last rename: rename -u`, () => {
  const newFiles = ['test/ten.txt'];
  const oldFiles = [`test/asdf${os.userInfo().username}`];
  beforeAll(async () => {
    // TODO: update when there is a better API for this
    const lastBatch = await SEQUELIZE.models.Batch.findOne({
      where: {
        undone: false
      },
      order: [[ 'createdAt', 'DESC' ]]
    });
    if (lastBatch !== null) {
      const ops = await SEQUELIZE.models.Op.findAll({
        where: {
          BatchId: lastBatch.id
        }
      });
      async.eachSeries(ops, async (o) => { await fs.rename(o.output, o.input); });
      lastBatch.undone = true;
      await lastBatch.save();
    }
  });
  test(`Old files don't exist`, async () => {
    const result = await async.every(oldFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(false);
  });
  test(`New files do exist`, async () => {
    const result = await async.every(newFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(true);
  });
});

describe(`Download and rename a mp3 file: rename test/music.mp3 --createdirs "test/{{id3.year}}/{{id3.artist}}/{{id3.track|padNumber(2)}} - {{id3.title}}.{{ext}}"`, () => {
  const oldFiles = ['test/music.mp3'];
  const newFiles = ['test/2019/Scott Holmes/04 - Upbeat Party.mp3'];
  beforeAll(async () => {
    await fs.writeFile('test/music.mp3', await download('https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Scott_Holmes/Inspiring__Upbeat_Music/Scott_Holmes_-_04_-_Upbeat_Party.mp3'));
    await runCommand('rename test/music.mp3 --createdirs "test/{{id3.year}}/{{id3.artist}}/{{id3.track|padNumber(2)}} - {{id3.title}}{{ext}}"');
  });
  test(`Old files don't exist`, async () => {
    const result = await async.every(oldFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(false);
  });
  test(`New files do exist`, async () => {
    const result = await async.every(newFiles, async (f) => { return await fs.pathExists(path.resolve(f)); });
    await expect(result).toBe(true);
  });
});

// HELPER FUNCTIONS

async function runCommand(command, undo) {
  undo = undo || false;
  let argv = yargs.options(yargsOptions).parse(`${command.replace(/^rename /, '')}${!undo ? ' --noundo' : ''}`);
  let batch = new Batch(argv, null, SEQUELIZE);
  await batch.complete();
}

/* eslint-disable eqeqeq */
function inWords (num) {
  let a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
  let b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str;
}
