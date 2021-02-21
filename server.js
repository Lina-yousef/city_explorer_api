'use strict';
const express =require ('express');

require('dotenv').config();
const cor =require('cors');

const server = express();
server.use(cors());

const PORT =process.env.PORT || 3030 ; 


