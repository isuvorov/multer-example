const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;
const multer = require('multer');

const storage = multer.diskStorage({
  //   dest: 'uploads',
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

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
  //   console.log(req.file);
  const filePath = path.join(__dirname, 'uploads', req.file.filename);

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(415).send('Unsupported Media Type');
  }

  if (!filePath.startsWith(path.join(__dirname, 'uploads'))) {
    return res.status(403).send('Forbidden');
  }

  next();
};

app.post('/upload', upload.single('image'), protectImages, (req, res) => {
  // req.file contains information about the uploaded file
  //   const path = '/uploads/'
  console.log(req.file);
  res.send(`Image uploaded successfully
  
  <img src="/${req.file.path}" />
  `);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
