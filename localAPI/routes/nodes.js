var express = require('express');
var router = express.Router();
var cote       = require('../cote'); // get the mongoose model

router.get('/', AllNodes);

function AllNodes(req, res) {
    res.send(cote.getNodes());
}

module.exports = router;