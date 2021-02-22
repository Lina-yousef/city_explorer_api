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


// to tell (PORT) to get data inside .env file
const PORT = process.env.PORT_env || 3030 ;
const superagent = require('superagent');

// Routes Definitions
server.get('/location',locationHandler);
server.get('/weather',weatherHandler);
server.get('/parks',parksHandler);
server.get('/',handleHomeRoute);
server.use('*',notFoundRouteHandler);
server.use(handleError);

//handling location
function locationHandler (req ,res ){
    // console.log(req.query.city);
    let cityName = req.query.city;
    
    //location url & keyword
    let key = process.env.LOCATION_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

    superagent.get(url)
    .then(locData=>{
        // console.log(locData.body[0]);
        //create location object
        const locObj = new Location(cityName,locData.body);
        // console.log(locObj);
        //send data to front-end
        res.send(locObj);
    })
    .catch(()=>{
        handleError('Error in getting data from locationiq',req,res);
    })
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
function Parks (element){

    this.name = element.fullName;
    this.address=`"${element.addresses[0].line1}" "${element.addresses[0].city}" "${element.addresses[0].stateCode}" "${element.addresses[0].postalCode}"`;
    this.fee='0.00';
    this.description=element.description;
    this.url=element.url;
}
function parksHandler(req,res){
    // console.log(req.query.latitude+','+req.query.longtude);
    let park = req.query.latitude+','+req.query.longtude;

    let key = process.env.PARK_KEY;
    let url = `https://developer.nps.gov/api/v1/parks?parkCode=${park}&api_key=${key}`;
    
    superagent.get(url)
    .then(park =>{
        // console.log(park.body);
        let parkData = park.body.data.map(element =>{
            return new Parks(element);
        });console.log(parkData);
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

server.listen(PORT, () =>{
    console.log(`listening on PORT ${PORT}`);
})