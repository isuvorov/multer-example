require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const multer = require('multer');

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
});

const app = express();
const port = process.env.PORT || 8080;

const upload = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    // metadata(req, file, cb) {
    //   console.log('[multerS3] [metadata]', file);
    //   cb(null, { fieldName: file.fieldname });
    // },
    key: (req, file, cb) => {
      console.log('[multerS3] [key]', file);

      cb(null, `${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

// const upload = multer({
//   storage: multer.diskStorage({
//     //   dest: 'uploads',
//     destination: (req, file, cb) => {
//       cb(null, 'uploads');
//     },
//     filename: (req, file, cb) => {
//       cb(null, file.originalname);
//     },
//   }),
// });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>File Upload Form</title>
    </head>
    <body>
      <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="image">
        <input type="submit" value="Upload">
      </form>
    </body>
  </html>  
  `);
});

// Middleware to check the file type and access permissions
const protectImages = (req, res, next) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
  if (!allowedTypes.includes(req.file.mimetype) || !allowedTypes.includes(req.file.contentType)) {
    // TODO: remove from s3
    return res.status(415).send(
      `Unsupported Media Type
    <br/>
    <pre>${JSON.stringify(req.file, null, 2)}</pre>`,
    );
  }

  //   if (!filePath.startsWith(path.join(__dirname, 'uploads'))) {
  //     return res.status(403).send('Forbidden');
  //   }
  return next();
};

app.post('/upload', upload.single('image'), protectImages, async (req, res) => {
  const { file } = req;
  const url = req.file?.location ? req.file?.location : `/${req.file?.path}`;
  res.send(`Image uploaded successfully
  <br/>
  <img src="${url}" />
  <br/>
  <pre>${JSON.stringify(req.file, null, 2)}</pre>
  `);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
