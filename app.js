var express = require("express");
var app = express();
var jquery = require("jquery");
var zomato = require("zomato");
var bodyParser = require("body-parser")
var User = require("./userschema");
var Resto = require("./restos");
var passport = require("passport");
var mongoose = require("mongoose");
var session = require("express-session");

require("./config/passport")
mongoose.connect('localhost:27017/data')

app.use(session({
    secret: 'ppmakeitcountsapp',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

var client = zomato.createClient({
    userKey: 'b4181d590bc6d8b9ec144bd7dbd38bac',
});

app.listen(8080, function() {
    console.log("running..........");
})
app.set("views", "./views");
app.set("view engine", "jade");

app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())
app.use(express.static("public"))

app.get('/', function(req, res) {
    res.render('index')
})

app.get('/show/user', function(req, res) {
    User.find({}).then(function(doc) {
        res.send(doc)
    })
})


app.post('/search', function(req, res) {
    var latitue = req.body.lat;
    var longitute = req.body.lng;
    client.getGeocode({
        lat: latitue, //latitude 
        lon: longitute //longitude 
    }, function(err, result) {
        if (!err) {
            var json = JSON.parse(result);
            var data = json.nearby_restaurants
            var resto = [];
            data.forEach(function(r) {
                var temp = {
                    "resto_id": r.restaurant.id,
                    "name": r.restaurant.name,
                    "cuisines": r.restaurant.cuisines,
                    "logo": r.restaurant.featured_image
                }
                resto.push(temp);
            })
            res.send(resto);
        }
        else {
            //console.log(err);
            res.send(err);
        }
    });

})

app.post('/add/resto', function(req, res) {
    Resto.findOne({
        'resto_id': req.resto_id
    }, function(err, doc) {
        if (err) {
            console.error(err);
            res.sendStatus('400')
        }

        if (doc) {
            if (doc.customers.includes(req.user._id)) {
                doc.totalGoing -= 1;
                doc.customers = doc.customers.filter(function(f) {
                    f != req.user._id;
                });
                doc.save();
            }
            else {
                doc.totalGoing += 1;
                doc.customers.push(req.user._id);
                doc.save();
            }
        }
        else {
            var newResto = new Resto();
            newResto.resto_id = req.resto_id
            newResto.customers.push(req.user._id)
            newResto.totalGoing = 1

            newResto.save(function(err) {
                if (err) {
                    throw err;
                }
                res.sendStatus(200);
            });
        }
    });

})
app.get('/justsearch', function(req, res) {
    client.getGeocode({
        lat: "28.613939", //latitude 
        lon: "77.209021",
    }, function(err, result) {
        if (!err) {

            res.send(result);
        }
        else {
            //console.log(err);
            res.send(err);
        }
    });

})

app.get('/authenticate', function(req, res) {
    console.log('hey');
    if (req.isAuthenticated()) {
        res.send('done');
    }
    else {
        res.send('nodone')
    }
})

app.get('/login', passport.authenticate('twitter'));

app.route('/auth/twitter/callback')
    .get(passport.authenticate('twitter', {
        successRedirect: '/',
        failureRedirect: '/donowhere'
    }));
