"use strict";

var _bull = _interopRequireDefault(require("bull"));
var _imageThumbnail = _interopRequireDefault(require("image-thumbnail"));
var _fs = require("fs");
var _mongodb = require("mongodb");
var _db = _interopRequireDefault(require("./utils/db"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const fileQueue = new _bull.default('fileQueue', 'redis://127.0.0.1:6379');
const userQueue = new _bull.default('userQueue', 'redis://127.0.0.1:6379');
async function thumbNail(width, localPath) {
  const thumbnail = await (0, _imageThumbnail.default)(localPath, {
    width
  });
  return thumbnail;
}
fileQueue.process(async (job, done) => {
  console.log('Processing...');
  const {
    fileId
  } = job.data;
  if (!fileId) {
    done(new Error('Missing fileId'));
  }
  const {
    userId
  } = job.data;
  if (!userId) {
    done(new Error('Missing userId'));
  }
  console.log(fileId, userId);
  const files = _db.default.db.collection('files');
  const idObject = new _mongodb.ObjectID(fileId);
  files.findOne({
    _id: idObject
  }, async (err, file) => {
    if (!file) {
      console.log('Not found');
      done(new Error('File not found'));
    } else {
      const fileName = file.localPath;
      const thumbnail500 = await thumbNail(500, fileName);
      const thumbnail250 = await thumbNail(250, fileName);
      const thumbnail100 = await thumbNail(100, fileName);
      console.log('Writing files to system');
      const image500 = `${file.localPath}_500`;
      const image250 = `${file.localPath}_250`;
      const image100 = `${file.localPath}_100`;
      await _fs.promises.writeFile(image500, thumbnail500);
      await _fs.promises.writeFile(image250, thumbnail250);
      await _fs.promises.writeFile(image100, thumbnail100);
      done();
    }
  });
});
userQueue.process(async (job, done) => {
  const {
    userId
  } = job.data;
  if (!userId) done(new Error('Missing userId'));
  const users = _db.default.db.collection('users');
  const idObject = new _mongodb.ObjectID(userId);
  const user = await users.findOne({
    _id: idObject
  });
  if (user) {
    console.log(`Welcome ${user.email}!`);
  } else {
    done(new Error('User not found'));
  }
});
