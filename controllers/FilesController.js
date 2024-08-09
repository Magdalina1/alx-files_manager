const dbClient = require('../utils/db'); // Assuming you have a database utility
const { ObjectId } = require('mongodb');

// Function to retrieve the user from the token
const getUserFromToken = async (token) => {
  const user = await dbClient.collection('users').findOne({ token });
  return user;
};

class FilesController {
  // GET /files/:id
  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.collection('files').findOne({
      _id: new ObjectId(fileId),
      userId: user._id,
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  // GET /files
  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || '0';
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;
    const skip = page * pageSize;

    const query = { userId: user._id, parentId };

    const files = await dbClient.collection('files').aggregate([
      { $match: query },
      { $skip: skip },
      { $limit: pageSize },
    ]).toArray();

    return res.status(200).json(files);
  }
}

module.exports = FilesController;
