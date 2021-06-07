var express = require('express');
var router = express.Router();


// const auth = require("./modules/authRoutes");
const task = require("./modules/taskRoutes");


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// router.use("/Auth", auth);
router.use("/task", task);


module.exports = router;
