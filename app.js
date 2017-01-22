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

const MongoStore = require('connect-mongo')(session);


require("./config/passport")
mongoose.connect('localhost:27017/data')

app.use(session({
    secret: 'ppmakeitcountsapp',
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    }),
    cookie: {
        maxAge: 180 * 60 * 1000
    }

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


app.use(function(req, res, next) {
    res.locals.login = req.isAuthenticated();
    res.locals.session = req.session;
    next();
})





/***************************************************/



app.get('/', function(req, res) {
    console.log("searchterm" + req.session.search)
        //req.session.destroy();
    req.session.restos.forEach(function(r) {
                console.log("r.resto_id"+r.resto_id);
                Resto.findOne({
                    'resto_id': r.resto_id
                    
                }, function(err, doc) {
                    if (err) res.send("something went wrong in databas");
                    if (doc) {
                        r.going = doc.totalGoing;
                    }
                })
            })

    res.render('index', {
        restos: req.session.restos,
        searchterm: req.session.search,
    })
})

app.get('/show/user', function(req, res) {
    User.find({}).then(function(doc) {
        res.send(doc)
    })
})


app.post('/search', function(req, res) {
    var latitue = req.body.city.lat;
    var longitute = req.body.city.lng;
    client.getGeocode({
        lat: latitue, //latitude 
        lon: longitute //longitude 
    }, function(err, result) {
        if (!err) {
            var json = JSON.parse(result);
            var data = json.nearby_restaurants
            var resto = [];
            var going = 0;
            data.forEach(function(r) {
                going = 0;
                var temp = {
                    "resto_id": r.restaurant.id,
                    "name": r.restaurant.name,
                    "cuisines": r.restaurant.cuisines,
                    "logo": r.restaurant.featured_image,
                    "going": going,
                }
                resto.push(temp);
            })
            req.session.restos = null;
            req.session.search = null;
            req.session.restos = resto;
            req.session.search = req.body.searchterm;
            //console.log("searchterm: " + req.session.search
            res.sendStatus(200);
        }
        else {
            //console.log(err);
            res.send(err);
        }
    });

})

app.post('/add/resto',isLoggedIn, function(req, res) {

    Resto.findOne({
        'resto_id': req.body.resto_id
    }, function(err, doc) {
        if (err) {
            console.error(err);
            res.sendStatus('400')
        }

        else if (doc) {
            if (doc.customers.indexOf(req.user._id) >= 0) {
                doc.totalGoing -= 1;
                doc.customers = doc.customers.filter(function(f) {
                    f != req.user._id;
                });
                doc.save();
                req.session.restos.forEach(function(r) {
                    if (r.resto_id == doc.resto_id) {
                        r.going = doc.totalGoing;
                    }
                })
                res.redirect('/');
            }
            else {
                doc.totalGoing += 1;
                doc.customers.push(req.user._id);
                doc.save();
                req.session.restos.forEach(function(r) {
                    if (r.resto_id == doc.resto_id) {
                        r.going = doc.totalGoing;
                    }
                })
                res.redirect('/');
            }

        }
        else {
            var newResto = new Resto();
            newResto.resto_id = req.body.resto_id
            newResto.customers.push(req.user._id)
            newResto.totalGoing = 1


            newResto.save(function(err) {
                if (err) {
                    throw err;
                }
                req.session.restos.forEach(function(r) {
                    if (r.resto_id == req.body.resto_id) {
                        r.going = 1;
                    }
                })
                res.redirect('/');
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

app.get('/login', passport.authenticate('twitter'));

app.route('/auth/twitter/callback')
    .get(passport.authenticate('twitter', {
        successRedirect: '/',
        failureRedirect: '/donowhere'
}));

function isLoggedIn(req,res,next){
    if(req.isAuthenticated){
        return next();
    }
    res.sendStatus(504);
}