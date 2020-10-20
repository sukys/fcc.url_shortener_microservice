'use strict';

let express = require('express');
let mongo = require('mongodb');
let mongoose = require('mongoose');
let cors = require('cors');
let bodyParser = require('body-parser')
let app = express();
const Schema = mongoose.Schema;

// Basic Configuration 
let port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }); 


// interceptor for debug purposes;
app.use(function(req, res, next){
    console.log(req.method + " " + req.path + " - " + req.ip);
    next();
});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));


// Define Model:
const urlSchema = new Schema({
    original_url: { type: String, required: true, unique : true},
    short_url: { type: Number, required: true },
}, { capped: 4056 });

const UrlModel = mongoose.model('urlShortner', urlSchema);




app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.route('/api/shorturl/new')
.post(function (req, res) {
    let url = req.body.url;
    var isValid = validarUrl(url);
    if(!isValid){
        res.json({"error":"invalid URL"});
        return
    } else {
        getResponse(url).then(result => {
            res.json(result);
        }).catch(err => {
            res.json({"error":"invalid URL"});
        });
    }
})


async function getResponse(url){
    let jsonResponse;
    let shortUrl = await retrieveShortUrl(url).then(result => {
        return result;
    }).catch(err => {
        console.log("\n== Error retrieving ==> " + err);
    });
    jsonResponse = {"original_url": url,"short_url":shortUrl};
    return jsonResponse;
}


function validarUrl(url){
    let regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
    return regex.test(url);
}


/*
async function criarShortUrl(url){
    var urlDoc = await retrieveShortUrl(url).then(result => {
        return result;
    }).catch(err => {
        console.log("\t== Error retrieving ==>");
        console.log("\t\tcriarShortUrl Error: " + err);

    });
    return urlDoc;
}
*/


async function retrieveShortUrl(url){
    let dbUrl = await UrlModel.findOne({'original_url':url}).exec();
    if(dbUrl == undefined ){
        dbUrl = await insertShortUrl(url).then(result => {
            return result;
        }).catch(err => {
            console.log("\t== Error inserting Url ==> " + + err);
        });
    }
    dbUrl = await UrlModel.findOne({'original_url':url}).exec();
    return dbUrl['short_url'];
}


async function insertShortUrl(url){
    var numberOfRecords = await getNumberOfRecords();
    var newUrl = new UrlModel();
    newUrl.original_url = url;
    newUrl.short_url = (numberOfRecords + 1);
    let xyz = await UrlModel.create(newUrl, function (err, data) {
        if (err) return console.error("\t== insertShortUrl ==> Error: " + err);
        return data;
    });
    let createData = await UrlModel.findOne({'original_url':url}).exec();
    return createData;    
}


async function getNumberOfRecords(){
    let total = await UrlModel.countDocuments().exec().then(result => {
        return result;
    }).catch(err => {
        return 0;
    });
    return total;
}


app.get("/api/shorturl/:url", function (req, res) {
    // redirect to url.
    res.json({ 'redirectiong': 'to url'});
});


app.listen(port, function () {
  console.log('Node.js ready and listening ...');
});