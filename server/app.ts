import express, { Request, Response, NextFunction } from 'express';
const path = require('path');
const app = express(); // create express app

app.use(express.static(path.join(__dirname, '..', 'build')));
//app.use(express.static('public'));
// start express server on port 5000

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
});

app.listen(5000, () => {
  console.log('server started on port 5000');
});
