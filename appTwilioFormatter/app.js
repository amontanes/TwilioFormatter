const express = require('express');
const passport = require('passport');
const xsenv = require('@sap/xsenv');
const JWTStrategy = require('@sap/xssec').JWTStrategy;
const bodyParser = require('body-parser');
const fs = require('fs')
const http = require("https");
var https = require('follow-redirects').https;
var qs = require('querystring');


var conversations = [];
var telephoneNumber = "";

const app = express();

const services = xsenv.getServices({ uaa: 'TwilioFormatterUAA' });

passport.use(new JWTStrategy(services.uaa));

app.use(passport.initialize());
app.use(passport.authenticate('JWT', { session: false }));

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
.post(function (req, resConector) {   

    telephoneNumber = req.body.telephoneNumber;
    var content         = req.body.content;

    // 1. Validar si el mensaje es un número
    if(!isNaN(content))
    {
        // 2. Buscar telephoneNumber en array de conversaciones
        var conversation = conversations.find(c => c.telephoneNumber === telephoneNumber);
        if(conversation){
            // 3. Buscar opción 
            var i = parseInt(content);
            var option = conversation.currentOptions.find(o => o.number === i);
            if(option){
                // 4. Cambiar número de opción por valor
                content = option.value; 

                // 5. Borrar conversación
                conversations.splice(conversations.findIndex(c => c.telephoneNumber === telephoneNumber), 1);
            }
        }
    }



  // CAI AySA
 var options = {
    'method': 'POST',
    'hostname': 'dev-cf-aysa-cai.authentication.eu10.hana.ondemand.com',
    'path': '/oauth/token',
    'headers': {
        'Accept': 'application/json;charset=utf8',
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    'maxRedirects': 20
};

  
    
    
    var req = https.request(options, function (res) {
        var chunks = [];
    
        res.on("data", function (chunk) {
            chunks.push(chunk);
        });
    
        res.on("end", function (chunk) {
            var body = Buffer.concat(chunks);
            var mensaje = JSON.parse(body.toString());
            var options = {
                'method': 'POST',

                // CAI AySA
                'hostname': 'dev-cf-aysa-cai.sapcai.eu10.hana.ondemand.com',
                'path': '/public/api/build/v1/dialog',                
                'headers': {
                    'Authorization': 'Bearer ' + mensaje.access_token,
                    'Content-Type': 'application/json',
                    // CAI AySA
                    'X-Token': 'f1e409ef132500959eb1f5f7d42ddb77',
                    'data-use-public-api': 'true' 

                    //X-Token se obtienen en CAI: settings->Versions->Request Token  
                },
                'maxRedirects': 20
            };
    
            var req = https.request(options, function (res) {
                var chunks = [];
    
                res.on("data", function (chunk) {
                    chunks.push(chunk);
                });
    
                res.on("end", function (chunk) {
                    var body = Buffer.concat(chunks);
                    var mensaje = JSON.parse(body.toString());

                    // Enviar respuesta a Twilio
                    var respuestas = [];

                    mensaje.results.messages.forEach(message => {
                        let respuesta = {   text: "", 
                                            imageURL: ""
                        };                        

                        switch (message.type) {
                            case 'text':
                                respuesta.text = formatTextToTwilio(message);
                                break;
                            case 'buttons':
                                respuesta.text = formatButtonsToTwilio(message);
                                break;
                            case 'quickReplies':
                                respuesta.text = formatQuickRepliesToTwilio(message);
                                // Antes de agregar una nueva conversación, se eliminan la conversación anterior para evitar
                                // errores al seleccionar los valores numéricos
                                conversations.splice(conversations.findIndex(c => c.telephoneNumber === telephoneNumber), 1);                                    
                                // Se agrega conversación con opciones numéricas y sus correspondientes textos
                                addConversation(message);
                                break;
                            case 'picture':
                                respuesta.imageURL = formatPictureToTwilio(message);
                            default:
                                break;
                        }
                        respuestas.push(respuesta);
                    });
                    resConector.send(respuestas);
                });
    
                res.on("error", function (error) {
                    console.error(error);
                });
            });
    
            var postData = JSON.stringify({ "message": { "content": content, "type": "text" }, "conversation_id": telephoneNumber });
    
            req.write(postData);
    
            req.end();
        });
    
        res.on("error", function (error) {
            console.error(error);
        });
    });
     
// CAI AySA

 var postData = qs.stringify({
    'grant_type': 'client_credentials',
    'client_id': 'sb-de19ca40-9376-4922-9b3b-ecb43c93a46a-CLONE-RT!b60775|cai-production!b20881',
    'client_secret': 'LljAueDbYSbvLdWViHpH8WNALVY=',
    'response_type': 'token'
});
    req.write(postData);
    
    req.end();

})


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


   function formatTextToTwilio(message) {
    // Devuelve el texto plano
    return message.content;

   }

   function formatButtonsToTwilio(message) {
    // 
    var respuesta = message.content.title + '\n';

    message.content.buttons.forEach(button => {
        respuesta = respuesta + '> ' + button.title + ': ' + button.value + "\n";
    });
    

    return respuesta;

   }

   function formatQuickRepliesToTwilio(message) {
    // Devuelve las opciones numeradas
    var respuesta = message.content.title + '\n';

    var i = 0;
    message.content.buttons.forEach(button => {
        i++;
        respuesta = respuesta + i + '. ' + button.title + "\n";
    });
    
    return respuesta;

   }

   function formatPictureToTwilio(message) {
    // Devuelve la URL de la imagen
    return message.content;
   }   

   function addConversation(message){
    var options = [];
    var conversation = {
        telephoneNumber: "",
        currentOptions: [],
    };
    var i = 0;


    message.content.buttons.forEach(button => {
        i++;
        options.push({number: i, value: button.title});
    });
    
    conversation.telephoneNumber = telephoneNumber;
    conversation.currentOptions  = options;
    conversations.push(conversation);
   }