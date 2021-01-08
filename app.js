const express = require('express');
const passport = require('passport');
const xsenv = require('@sap/xsenv');
//const JWTStrategy = require('@sap/xssec').JWTStrategy;
const bodyParser = require('body-parser');
const fs = require('fs');
const http = require("https");
const FormData = require('form-data');

const app = express();

//const services = xsenv.getServices({ uaa: 'ParserPDFUAA' });

//passport.use(new JWTStrategy(services.uaa));

app.use(passport.initialize());
//app.use(passport.authenticate('JWT', { session: false }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/', function(req, res) {
    var respuesta = {
     error: true,
     mensaje: 'Punto de inicio',
     url: 'HTTPS://+...+/ConectorTwilioCAI'
    };
    res.send(respuesta);
   });

app.route('/ConectorTwilioCAI')
.post(function (req, res) {   

    //Se formatea en formato de CAI
    
    

    // Se consume API de CAI


    // Se devuelve respuestas a Twilio

 
});

      
app.use(function(req, res, next) {
    var respuesta = {
     error: true, 
     mensaje: 'URL no encontrada',
     url: ''
    };
    res.status(404).send(respuesta);
   });
   app.listen(8080, () => {
    console.log("El servidor está inicializado en el puerto 8080");
   });

