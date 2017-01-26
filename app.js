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
var NodeGeocoder = require('node-geocoder');

var options = {
    provider: 'google',

    // Optional depending on the providers 
    httpAdapter: 'https', // Default 
    apiKey: 'AIzaSyDliVHqw1Sief3cEcVmnHtrKdq0MY03p7k', // for Mapquest, OpenCage, Google Premier 
    formatter: null // 'gpx', 'string', ... 
};
var geocoder = NodeGeocoder(options);
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



function updateResto(req, res, next) {
    if(req.session.restos){
    for (var i = 0; i < req.session.restos.length; i++) {
        console.log("i = " + i);
        Resto.findOne({
            'resto_id': req.session.restos[i].resto_id
        }, function(err, doc) {
            console.log("req.session.restos[i]" + req.session.restos[i])
            if (err) console.log(err);
            if (doc) {
                console.log(doc);
            }
        })
    }
    return next();
    }else{
        return next();
    }
}


app.get('/', updateResto, function(req, res) {
    console.log("searchterm" + req.session.restos)
    console.log("login" + res.locals.login)
    
    if(req.session.restos){
        
    
    res.render('index', {
        restos: req.session.restos,
        searchterm: req.session.search,
        user: req.user
    })
    }else{
        res.render('index');
    }
    
})

app.get('/api/restos/:city', function(req, res) {
    var latitude, longitude;
    geocoder.geocode(req.params.city, function(err, result) {
        console.log(result);
        req.session.search = req.params.city;
        latitude = result[0].latitude;
        longitude = result[0].longitude;

        client.getGeocode({
            lat: latitude, //latitude 
            lon: longitude //longitude 
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
                req.session.search = req.params.city;
                res.redirect('/');
            }
            else {
                //console.log(err);
                res.send(err);
            }
        });
    });

})

app.post('/add/resto', function(req, res) {
    if (!res.locals.login) {
        console.log("checkin auth");
        res.redirect('/');
    }
    else {
        console.log("body restoid: " + req.body.resto_id);
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
                            console.log("ssaved and incremented")

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
                            console.log("ssaved and incremented")
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
                            console.log("added and incremented")
                        }
                    })
                    res.redirect('/');
                });
            }
        });
    }
})
// authentication

app.get('/login', passport.authenticate('twitter'));

app.route('/auth/twitter/callback')
    .get(passport.authenticate('twitter', {
        successRedirect: '/',
        failureRedirect: '/donowhere'
    }));
app.get('/logout', function(req, res) {
    req.logout();
    req.session.destroy()
    res.redirect('/')
})
