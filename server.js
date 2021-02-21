'use strict';
const express = require ('express');
require('dotenv').config();
const cors =require('cors');


const server = express();
server.use(cors());
const PORT = process.env.PORT_env || 3030 ;


server.get('/location' , (req ,res )=>{
    const locData = require('./data/location.json');
    
    const locObj = new Location(locData);
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
    let weatherArr = [];
    
    weData.data.forEach(element => {
        // console.log(element.weather.description);
        // console.log(element.datetime);
        
        const weathData = new Weather(element.weather.description ,element.datetime ) ;
        weatherArr.push(weathData);
        // console.log(weathData);
    });
    // console.log(weatherArr);
    
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