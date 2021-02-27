'use strict';

//get library
const express = require ('express');
//get package (express) from node_module inside (server)
const server = express();

//install .env
require('dotenv').config();
//get cors
const cors =require('cors');
//use cors
server.use(cors());


const pg =require('pg');
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
// to tell (PORT) to get data inside .env file
const PORT = process.env.PORT_env || 3030 ;
const superagent = require('superagent');

// Routes Definitions
server.get('/location',locationHandler);
server.get('/weather',weatherHandler);
server.get('/parks',parksHandler);
server.get('/movies',movieHandler);
server.get('/yelp',yelpHandling);
server.get('/try',tryHandler);
server.get('/',handleHomeRoute);
server.use('*',notFoundRouteHandler);
server.use(handleError);


function tryHandler (req , res){

    let SQL = `SELECT * FROM locations;`;
    client.query(SQL)
    .then(results =>{
        // console.log(results);
        res.send(results.rows);
    })
}

//handling location

function locationHandler (req ,res ){
    // console.log(req.query.city);
    let cityName = req.query.search_query;
    
    //location url & keyword
    let key = process.env.LOCATION_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

    let SQL = `SELECT * FROM locations;`;
    let SQL2 =`SELECT * FROM locations WHERE search_query=$1;`;
    let arrSQL =[];

    client.query(SQL)
    .then(result =>{
        if(result.rows.length <= 0 ){
            superagent.get(url)
            .then((locData)=>{
                console.log('From API');
                const locObj = new Location(cityName,locData.body);
                setToDB(locObj);
                res.send(locObj);
            })
        }else {
            arrSQL = [cityName];
            client.query(SQL2 , arrSQL)
            .then(result =>{
                if(result.rows.length <= 0){
                    // console.log(`From the other side`);
                    superagent.get(url)
                    .then((locData2)=>{
                    const locObj = new Location(cityName,locData2.body);
                    setToDB(locObj);
                    res.send(locObj);
                    })
                }else {
                    console.log(`From DB`);
                    res.send(result.rows[0]);
                }
            })
        
    }
    })
    .catch(()=>{
        handleError('Error in getting data from locationiq',req,res);
    })
}

function setToDB (obj) {

    let insertSQL = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4);`;
    let safeValues = [
        obj.search_query,
        obj.formatted_query,
        obj.latitude,
        obj.longtude,
    ];
    client.query(insertSQL, safeValues)
    .then(() => {
        console.log('storing data in database');
    });
}

function Location (search_query,locationData){
    this.search_query= search_query;
    this.formatted_query=locationData[0].display_name;
    this.latitude = locationData[0].lat;
    this.longtude = locationData[0].lon;
}
function Weather (description ,datetime){
    this.forecast = description ;
    this.time = datetime;
}

function weatherHandler(req ,res){
    
    // console.log(req.query.search_query);
    let weath =req.query.search_query;
    
    let key = process.env.WEATHER_KEY;
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${weath}&key=${key}`;
    
    superagent.get(url)
    .then(weatherArr =>{
        
        let weatherData = weatherArr.body.data.map(element => {
            return new Weather(element.weather.description ,element.datetime ) ;
        });
        // console.log(weatherData);
        res.send(weatherData);
    })
    .catch(()=>{
        handleError('Error in getting data from locationiq',req,res);
    })
}

// Movie Handling
function movieHandler (req,res){
    //https://api.themoviedb.org/3/movie/550?api_key=bc5ec481edc848bb2e491e2d1dcc3f61
    
    let city=req.query.search_query;
    let key=process.env.MOVIE_KEY;
    let url = `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${city}`;
console.log(req.query.search_query);
    superagent.get(url)
    .then(movieArr =>{
        let movieData = movieArr.body.results.map(element =>{
            return new Movie(element);
        });
        res.send(movieData);
        // console.log(movieArr.body);
    })
    .catch(()=>{
        handleError('Error in getting data from locationiq',req,res);
    })
}
function Movie (data){
    this.title =data.title ;
    this.overview = data.overview;
    this.average_votes =data.vote_average;
    this.total_votes = data.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
    this.popularity = data.popularity;
    this.released_on =data.release_date;
}

 function yelpHandling (req,res){
    //https://api.yelp.com/v3/businesses/search
     
     let key = process.env.YELP_KEY;
     let city=req.query.search_query;

     const page =req.query.page;
     const numPerPage = 5;
     const start =((page - 1) * numPerPage + 1);
     
     const url =`https://api.yelp.com/v3/businesses/search?location=${city}&limit=${numPerPage}&offset=${start}`;
     
     superagent(url)
     .set('Authorization', `Bearer ${key}`)
        .then(yelpArr =>{
            let yelpData = yelpArr.body.businesses.map(element =>{
                return new Yelp (element);
            })
            res.send(yelpData);
        })
        .catch(()=>{
        handleError('Error in getting data from locationiq',req,res);
    })
    }
   
function Yelp (data){
    this.name=data.name;
    this.image_url=data.image_url;
    this.price=data.price;
    this.rating=data.rating;
    this.url=data.url;
}

// park Handling
function Parks (element){

    this.name = element.fullName;
    this.address=`"${element.addresses[0].line1}" "${element.addresses[0].city}" "${element.addresses[0].stateCode}" "${element.addresses[0].postalCode}"`;
    this.fee='0.00';
    this.description=element.description;
    this.url=element.url;
}
function parksHandler(req,res){
    // console.log(req.query.latitude+','+req.query.longtude);
    let park = req.query.search_query;

    let key = process.env.PARK_KEY;
    let url = `https://developer.nps.gov/api/v1/parks?q=${park}&api_key=${key}`;
    
    superagent.get(url)
    .then(park =>{
        // console.log(park.body);
        let parkData = park.body.data.map(element =>{
            return new Parks(element);
        });
        // console.log(parkData);
        res.send(parkData);
    })
     .catch(()=>{
        handleError('Error in getting data from locationiq',req,res);
    })
}
function handleHomeRoute(req,res){
 res.send('Home route');
}

function notFoundRouteHandler(req , res){
 res.status(500).send('Sorry, something went wrong')
}
function handleError(error , req , res){
    const errObj = {
        status:'500',
        responseText :'Sorry, something went wrong'
    }
    res.status(500).send(errObj);

}

client.connect()
.then(()=>{
    server.listen(PORT, () =>
    console.log(`listening on ${PORT}`)
    );
})
