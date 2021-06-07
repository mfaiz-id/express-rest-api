const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const jwtMiddleware = require('express-jwt-middleware');
var jwtCheck = jwtMiddleware(process.env.API_SECRET)
const task_api = require("../../api/controller/TaskController");
const router = express.Router();
router.get('/task', task_api.get_task);

module.exports = router;