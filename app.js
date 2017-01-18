var express = require("express");
var app = express();
var jquery = require("jquery");
var zomato = require("zomato");
var bodyParser = require("body-parser")
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

app.get('/authenticate',function(req,res){
    console.log('hey');
})
