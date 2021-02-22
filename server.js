'use strict';

//get library
const express = require ('express');

//install .env
require('dotenv').config();
//get cors
const cors =require('cors');
//use cors
server.use(cors());

//get package (express) from node_module inside (server)
const server = express();

// to tell (PORT) to get data inside .env file
const PORT = process.env.PORT_env || 3030 ;

//location link   pk.d634ea20f4144b59e97ee98ebf489a1d
//API LINK        df13e4e00db44a7a93160cc6e4eb03d2


//handling location
server.get('/location' , (req ,res )=>{
    //get data from location file
    const locData = require('./data/location.json');
    //create location object
    const locObj = new Location(locData);

    //send data to front-end
    res.send(locObj);
})

function Location (locationData){
    this.search_query='seattle';
    this.formatted_query=locationData[0].display_name;
    this.latitude = locationData[0].lat;
    this.longtude = locationData[0].lon;
}

server.get('/weather' ,(req ,res)=>{
    const weData = require ('./data/weather.json');

    let weatherArr = weData.data.map(element => {
       return new Weather(element.weather.description ,element.datetime ) ;
    });
    res.send(weatherArr);
})

function Weather (description ,datetime){
    this.forecast = description ;
    this.time = datetime;
}
server.use('*',(req , res)=>{
res.status(500).send('Sorry, something went wrong')
})

server.listen(PORT, () =>{
    console.log(`listening on PORT ${PORT}`);
})