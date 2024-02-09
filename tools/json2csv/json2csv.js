/**
 * Created by SE02 on 2017/8/11.
 */
var express = require('express');
var fs = require('fs');
var path = require('path');
var  _= require('underscore');
var moment = require('moment');
var json2csv = require('json2csv');

var _FIELDS = process.env._FIELDS ||['car', 'price', 'color'];
var _JSON_DATA = process.env._JSON_DATA || [
        {
            "car": "Audi",
            "price": 40000,
            "color": "blue"
        }, {
            "car": "BMW",
            "price": 35000,
            "color": "black"
        }, {
            "car": "Porsche",
            "price": 60000,
            "color": "green"
        }
    ];
var _PATH_SAVE_CSV = process.env._PATH_SAVE_CSV || ".";

var csv = json2csv({ data: _JSON_DATA, fields: _FIELDS });

fs.writeFile(path.join(_PATH_SAVE_CSV,'file.csv'), csv, function(err) {
    if (err) throw err;
    console.log('file saved');
});

