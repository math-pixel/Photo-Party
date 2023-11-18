const express = require('express');
const port = 5000;
const path = require('path');
const bodyParser = require("body-parser");
const app = express();
const fileUpload = require('express-fileupload');
const AdmZip = require("adm-zip");
const mysql = require('mysql'); 
const fastcsv = require("fast-csv");
const fs = require("fs");
const creationQuery = require( __dirname + "/database")
const config = require(__dirname + "/public/config.json")

// console.log(__dirname)
// ? pour exporter les email en csv
const writeStream = fs.createWriteStream( __dirname + "/files/mailing.csv");
// ? lib pour suppr tout les fichier d'un dossier
const fsExtra = require('fs-extra')


//! ############ Variable ############ 

let query = "";
let queueId = [];
let loopMessageTimer;

let adminName = config.usernameAdmin
let adminMDP = config.passwordAdmin

let isAllowGlobal = true
let isWaitingGlobal = false

//! ############ Config app ############ 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

// pour avoir access au image directement depuis le web
app.use('/', express.static('public'));
app.use('/PhotoUpload', express.static(__dirname + '/PhotoUpload'));
app.use('/PhotoUploadAdmin', express.static(__dirname + '/PhotoUploadAdmin'));
app.use('/files', express.static(__dirname + '/files'));
app.use('/styles', express.static(__dirname + '/styles'));

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  
});


//! ############ my sql ############ 

// bdd et query creation for bdd

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "photoparty"
});


//! ############ websocket ############ 
const WebSocketServer = require('ws');
const wss = new WebSocketServer.Server({ port: 8080 })
let ws = null

// stock all client for broadcast
let clients = [];

// Creating connection using websocket
wss.on("connection", webso => {

    ws = webso

    // broadcast
    clients.push(webso);


    console.log("new client connected in websocket");
 
    // handling what to do when clients disconnects from server
    ws.on("close", () => {
        // console.log("the client has connected");
    });
    // handling client connection error
    ws.onerror = function () {
        console.log("Some Error occurred websocket")
    }


    webso.on("message", function incoming(dataBrut) {
      let data = JSON.parse(dataBrut.toString())
      // console.log(data)
        
      try {

        //? ############ data de admin ############
        if(data.requestImage == true){ 
          // * ############### get all image info and send it to admin panel ###############
          con.query("SELECT * FROM `photos` WHERE 1", function (err, result, fields) {
            // write error in logfile
            if (err){
              // fs.writeFile("log.txt", err)
            }else{
              result = JSON.stringify(result)
              sendImageDataToAdminPanel(result)
            }
          })
        }

        //? ############ dataParameter de admin ############
        else if(data.requestAdminParameter == true){
          // * ############### get all info parameter and send it to admin panel parameter ###############
          con.query("SELECT * FROM `adminparameter` WHERE 1", function (err, result, fields) {
            // write error in logfile
            if (err){
              // fs.writeFile("log.txt", err)
            }else{
              result = JSON.stringify(result)
              sendParameterDataToAdminPanel(result)
            }
          })
        }

        //? ############ Admin change allow value ############
        else if (data.changeAllowValue) {

          let idRow = data.changeAllowValue.idRow
          let value = data.changeAllowValue.value

          con.query(`UPDATE \`photos\` SET \`is_allowed\`=${value} WHERE \`photo_id\` = ${idRow}`, function (err, result, fields) {
            // write error in logfile
            if (err){
              // fs.writeFile("log.txt", err)
            }
          })
        }

        //? quand le video proj fait ca premiere connection
        else if(data.requestImageVideoProj){
          sendImageToProjecteur()
        }

        //? admin accept or refuse image when admin_before is on
        else if(data.removeFromWaitingList){
          let idRow = data.removeFromWaitingList.idRow

          // ? enlever le is waiting de la photo dans la db
          con.query(`UPDATE \`photos\` SET \`is_waiting\`=0 WHERE \`photo_id\` = ${idRow}`, function (err, result, fields) {
            // write error in logfile
            if (err){
              // fs.writeFile("log.txt", err)
            }
          })

          // ? recuperer si la photo est allow apres lavoir enregistrer dans la db savoir si elle doit passer
          con.query(`SELECT \`is_allowed\` FROM \`photos\` WHERE \`photo_id\` = ${idRow}`, (err, result, fields) => {
            // write error in logfile
            if (err){
              // fs.writeFile("log.txt", err)
            }else{
              // console.log("is allow" , result[0].is_allowed)
              if ( result[0].is_allowed == 1 ) {
                queueId.push(idRow)
              }
            }
          })

        }

        // ? admin parameter export photo
        else if (data.requestExportPhoto) {

          // ? creaate zip folder of photo
          createZipArchive().then(() => {
            sendMessageWebso(JSON.stringify( { adminPanel : { downloadImages : true } } ))
          })

        }

        //? admin parameter export email 
        else if (data.requestExportEmail) {

          createCSVfileOfMAilList().then(() => {

            sendMessageWebso(JSON.stringify( { adminPanel : { downloadMail : true } } ))

          })

        }

        // ? admin parameter delete photo in folder and db
        else if (data.requestDeletePhoto) {
          
          //? delete in folder
          setEmptyDir( __dirname + "/PhotoUpload")

          // ? in db
          con.query("DELETE FROM `photos` WHERE 1", (error, data, field) => {
            if (error) throw error;

            console.log(data)
          })
        }

        // ? admin parameter delete mail in db
        else if (data.requestDeleteEmail) {
        
          // ? in db
          con.query("DELETE FROM `users` WHERE 1", (error, data, field) => {
            if (error){
              sendMessageWebso(JSON.stringify({adminPanel : { alertErrorDeleteMail : true }}))
            }

            console.log(data)
          })
        }


      } catch (error) {

        console.log("error receive message websocket", error)
      }
    
    });

});
console.log("The WebSocket server is running on port 8080");


function sendMessageWebso(message){
  // console.log(message)
    // sending message to client
    if(ws){
        // send in broadcast 
        clients.forEach(function(client) {
            client.send(message);
        });
    }
}

async function createZipArchive() {
  try {
    const zip = new AdmZip();
    const outputFile = __dirname + "/files/photos.zip";
    zip.addLocalFolder( __dirname + "/PhotoUpload");
    zip.writeZip(outputFile);
    console.log(`Created ${outputFile} successfully`);
  } catch (e) {
    console.log(`Something went wrong. ${e}`);
  }
}

async function createCSVfileOfMAilList(){
  console.log("export email en cour")
  con.query("SELECT `email` FROM `users` WHERE 1", (error, data, field) => {
    if (error) throw error;


    const jsonData = JSON.parse(JSON.stringify(data));
  
    fastcsv
      .write(jsonData, { headers: true })
      .on("finish", function() {
        console.log("Write to mailing.csv successfully!");
      })
      .pipe(writeStream);

    
  })

}

function setEmptyDir(pathDir){
  fsExtra.emptyDirSync(pathDir);
}
//! ############ Client ############ 

//* phone GET
app.get('/', function (req, res) {
  const options = {
      root: path.join(__dirname)
  };

  const fileName = 'phone-client/connectionPage.html';
  res.sendFile(fileName, options, 
    
    function (err) {
      if (err) {
          // next(err);
      } else {
          // console.log('Sent:', fileName);
      }
    });
});

//* une fois que le client est connecter !
app.post('/app', function(req, res) {

  let name = req.body.nom; 
  let email = req.body.email; 

  // verif if the user is in db
  query = creationQuery.selectQuery("users", "1", ` \`email\` = '${email}' `)
  con.query(query, function (err, result, fields) {
        if (err){
          res.redirect("/")
        };
        
        //* ##### if is already in db #####
        if(result[0] != undefined){

          // * update account pseudo

          query = creationQuery.updateQuery("users",  `  \`pseudo\` = "${name}"  ` , ` \`email\` = "${email}" `)
          con.query(query, function (err, result, fields) {
            if (err){
              res.redirect("/")
            };
            // console.log(result);
          });

        }else{

          // * add user to db

          query = creationQuery.insertQuery("users",  "`pseudo`, `email`" , `"${name}", "${email}"`)
          con.query(query, function (err, result, fields) {
            if (err){
              res.redirect("/")
            };
            // console.log(result);
          });

        }

    });

    //  REDIRECT PAGE

  res.sendFile( __dirname  + '/phone-client/main.html');
});

// * quand le client envoie un fichier => redirige vers app avec les identifiant
app.post('/importingFile', (req , res) => { 

  let commentaire = "";
  let pathCurrentImage = "";
  let emailClient = req.body.emailfield
  let clientId = null


  // * ############### get user info ###############
  query = creationQuery.selectQuery("users", "`users_id`", `\`email\`='${emailClient}' `)
  con.query(query, function (err, result, fields) {
    // write error in logfile
    if (err){
      // fs.writeFile("log.txt", err)
      res.redirect(307, "/")
    }else{
      //? else not error
      
      
      //! ############### if client exist ##############
      if(result[0] != undefined){
        clientId = result[0].users_id
        // console.log("client id : ", clientId)

        //* ############### good redirection ###############
        res.redirect(307, "app")

        //* ############### if image save it on server ###############
        if(!(req.files == null)){
          // Get the file that was set to our field named "image"
          const { image } = req.files;
          
          // Move the uploaded image to our upload folder
          pathCurrentImage =  '/PhotoUpload/' + Date.now() + image.name
          image.mv(__dirname + pathCurrentImage);
        }else{

          //? ############### else save path image error ###############

          pathCurrentImage = '/PhotoUploadAdmin/erreurFile.svg'
        }

        //* ############### if comment save it ###############
        // remove empty space for test empty
        if(req.body.comment.replace(/\s/g, '') != ""){

          commentaire = req.body.comment

          // replace comm for sql error
          commentaire.replace("'", '\'')
        }



        // * ############### if there is not empty media or com ###############
        // console.log(req.body.comment)
        // console.log(req.body.comment.replace(/\s/g, '') != "" || !(req.files == null), req.body.comment != undefined )
        if (req.body.comment.replace(/\s/g, '') != "" || !(req.files == null)) {

          

          // * ############### insert file in db ###############
          query = creationQuery.insertQuery("photos",  "`user_id`, `media`, `commentary`, `is_allowed`, `is_waiting`" , `${clientId}, '${pathCurrentImage}', '${commentaire}', ${isAllowGlobal}, ${isWaitingGlobal}`)
          con.query(query, function (err, result, fields) {
            // write error in logfile
            if (err){
              // fs.writeFile("/log.txt", err)
              // res.redirect(307, "/")
            }else{

  
              // * ############### add ( id row ) in queue to diffuse them if is not admin before ###############
              let idPhoto = result.insertId
              //? get admin before boolean
              con.query("SELECT `administration_before` FROM `adminparameter` WHERE `id_adminparameter` = 1", (err, result, fields) => {
                
                // write error if needed
                // if (err) {fs.writeFile("/log.txt", err)};
                // console.log("admin before " , result[0].administration_before)
                // ? si il ny a pas daministration avant alors ajoute la photo
                if ( result[0].administration_before == 0 ) {
                  queueId.push(idPhoto)
                }
              })
              
  
              // * ############### send image to admin panel ###############
              let arrayData = [
                {"photo_id":result.insertId,
                "user_id":clientId,
                "media":pathCurrentImage,
                "commentary":commentaire,
                "is_allowed":isAllowGlobal,
                "is_waiting": isWaitingGlobal
              }]
              arrayData = JSON.stringify(arrayData)
  
              sendImageDataToAdminPanel(arrayData) 

            }              
          });

        }



      }else{

        //* ############### redirect to error client page ###############
        // res.json({"error": "you have not an account"})
        res.redirect("/")
        // fs.writeFile("/log.txt", "no compte")

      }
    }
  });
})

//! ############ Admin ############ 


//* connection page admin
app.get('/admin', function (req, res) {
  const options = {
      root: path.join(__dirname)
  };

  const fileName = 'client-Administrator/administrator.html';
  res.sendFile(fileName, options);


});

app.post("/admistration", (req,res) => {

  // verifie que cest le bon mdp et bon usuer
  if(req.body.mdp === adminMDP && req.body.nom == adminName){


    //* si il vient des parametre alors enregistrer la configuration
    if (req.body.comeToParameter) {

      
      // ###### file #####

      let imageLogo1 = ""
      let imageLogo2 = ""
      let pathLogo1
      let pathLogo2

      if(req.files != null){
        // Get the file that was set to our field named "image"
        const { image2 } = req.files;

        imageLogo1 = req.files.logo1 
        imageLogo2 = req.files.logo2 
        // console.log(req.files.logo1)
        // console.log(req.files.logo2)
        // Move the uploaded image to our upload folder

        if (req.body.image1isChange == 'true') {
          if (imageLogo1 != undefined) {
            pathLogo1 = '/PhotoUploadAdmin/logo1.jpg'
            imageLogo1.mv(__dirname + pathLogo1);
          }else{
            pathLogo1 = ""
          }
        }
        
        if (req.body.image2isChange == 'true') {
          if (imageLogo2 != undefined) {
            pathLogo2 = '/PhotoUploadAdmin/logo2.jpg'
            imageLogo2.mv(__dirname + pathLogo2);
          }else{
            pathLogo2 = ""
          }
        }

      }

      // ###### administration before #####

      let isAdminBefore = false
      if (req.body.adminBefore == undefined) {
        isAdminBefore = false
      }else{
        isAdminBefore = true
      }
      
      //? ########## enregistrement dans la db ##########
      //* ##### image1 #####
      if (req.body.image1isChange == 'true') {
        con.query(`UPDATE \`adminparameter\` SET \`url_image_logo1\`= '${pathLogo1}' WHERE 1`, function (err, result, fields) {
            // console.log(result)
          })
      }

      //* ##### image2 #####
      if (req.body.image2isChange == 'true') {
        con.query(`UPDATE \`adminparameter\` SET \`url_image_logo2\`= '${pathLogo2}' WHERE 1`, function (err, result, fields) {
            // console.log(result)
          })
      }

      //* ##### moderate before #####
      con.query(`UPDATE \`adminparameter\` SET \`administration_before\`= ${isAdminBefore} WHERE 1`, function (err, result, fields) {
        
        if (isAdminBefore == true) {
          // * si il doit administrer avant alors on met les image en waiting mais on les affiche pas
          isWaitingGlobal = true;
          isAllowGlobal = false;
        }else{
          // * sinon linverse on affiche les image sans attendre
          isWaitingGlobal = false;
          isAllowGlobal = true;
        }

      })
      
      // send message websocket to projecteur to update image
      sendImageToProjecteur()
    } 

    //* ##### redirection #####
    res.sendFile( __dirname  + '/client-Administrator/panelAdmin.html');
  }else{
    res.redirect("admin")
  }
})

app.post("/adminParameter", (req,res) => {
  res.sendFile(__dirname  + '/client-Administrator/panelAdminParameter.html')
})


function sendImageDataToAdminPanel(message){

  sendMessageWebso(`
        { "adminPanel" :

          {
            "setUpImages" : ${message}
          }
        }
    `)
}

function sendParameterDataToAdminPanel(message){
  sendMessageWebso(`
  { "adminPanel" :
    {
      "setUpAdminParameter" : ${message}
    }
  }
`)
}

function sendImageToProjecteur(){
  
  con.query("SELECT * FROM `adminparameter` WHERE 1", function (err, result, fields) {
  
    console.log(result)
    sendMessageWebso(`
    { "projecteur" :
      {
        "pathLogo1" : "${result[0].url_image_logo1}",
        "pathLogo2" : "${result[0].url_image_logo2}"
      }
    }
    `)
  })
}

//! ############ Projecteur ############ 

//* Get for the video projection
app.get('/projecteur', function (req, res) {
  const options = {
      root: path.join(__dirname)
  };

  const fileName = 'video-proj/video.html';
  res.sendFile(fileName, options, function (err) {
      if (err) {
          next(err);
      } else {
          // console.log('Sent:', fileName);
      }
  });

  loopMessage()

});


let nbImageDifuse = 0
function loopMessage(){

    // set timer pour envoyer les data au video proj
    loopMessageTimer = setTimeout(() => {

      if (nbImageDifuse === config.nbImageBeforeImageInformation && config.nbImageBeforeImageInformation != 0) {
        // * diffusion image inscription
        sendConnectionImageToProjo()
        nbImageDifuse = 0
      }else{

        // * diffusion des image normal
        // * ############### si la queue est vide ###############
        if (queueId.length == 0) {

          sendRandomImageToProjo()
          
        }else{

          sendQueudImageToProjo()

        }

        nbImageDifuse += 1
      }
      
      clearTimeout(loopMessageTimer)
      loopMessage()

    }, config.timeoutImageInformation);
    
}

function sendRandomImageToProjo(){
  // get ramdom image

  con.query("SELECT * FROM photos WHERE `is_allowed` = 1 ORDER BY RAND ( ) LIMIT 1 ", function (err, result, fields) {


    if (result[0] != undefined) {
      sendMessageWebso(`
      { "projecteur" :
        {
          "image" : "${result[0].media}",
          "commentaire" : "${result[0].commentary}"
        }
      }
      `)
    }
    

  });
}

function sendQueudImageToProjo(){
  // * ############### in queue ###############

  con.query(`SELECT * FROM photos WHERE \`photo_id\` = ${queueId[0]}`, function (err, result, fields) {
  
    if (result[0] != undefined) {
      sendMessageWebso(`
      { "projecteur" :
        {
          "image" : "${result[0].media}",
          "commentaire" : "${result[0].commentary}"
        }
      }
      `)
    }
    
    
    // ############### remove current element to queue ###############
    queueId.shift()

  });
}

function sendConnectionImageToProjo(){

  sendMessageWebso(`
  { "projecteur" :
    {
      "image" : "/PhotoUploadAdmin/page_connexion.png",
      "commentaire" : "remove ui"
    }
  }
    `)
}
