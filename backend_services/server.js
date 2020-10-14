const express = require('express');
const app = express();
constbodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const formidable = require('formidable');
const { google } = require('googleapis');
const credentials = require('./credentials.json');
const { OAuth2Client } = require('google-auth-library');

const client_id = credentials.web.client_id;
const client_secret = credentials.web.client_secret;
const redirest_uris = credentials.web.redirect_uris;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirest_uris[2]);

//require('dotenv/config')

const SCOPE = ['https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/photoslibrary']

app.use(cors());
app.use(express.json());

var file_store = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, filename, cb) {
        cb(null, Date.now() + '.' + file.originalname)
    }
});

app.get('/', (req, res) => res.send('Stated the api'));

app.get('/getAuthURL', (req, res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPE,
    });
    res.send({ authUrl });
});

app.post('/getToken', (req, res) => {
    console.log("get token code" + req.body.code);
    if (req.body.code == null) return res.status(400).send('Invalid Request');
    oAuth2Client.getToken(req.body.code, (err, token) => {
        if (err) {
            console.error('Error retrieving access token', err);
            return res.status(400).send('Error retrieving access token');
        }
        console.log(token);
        const accessToken = token.access_token;
        console.log(accessToken);
        res.send({ accessToken });
    });
});

app.post('/getUserInfo', (req, res) => {
    if (req.body.token == null) return res.status(400).send('Token not found');
    oAuth2Client.setCredentials(req.body.token);
    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });

    oauth2.userinfo.get((err, response) => {
        if (err) res.status(400).send(err);
        console.log(response.data);
        res.send(response.data);
    })
});

app.post('/readDrive', (req, res) => {
    if (req.body.token == null) return res.status(400).send('Token not found');
    oAuth2Client.setCredentials(req.body.token);
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    drive.files.list({
        pageSize: 10,
    }, (err, response) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            return res.status(400).send(err);
        }
        const files = response.data.files;
        if (files.length) {
            console.log('Files:');
            files.map((file) => {
                console.log(`${file.name} (${file.id})`);
            });
        } else {
            console.log('No files found.');
        }
        res.send(files);
    });
});

app.post('/fileUpload', (req, res) => {
    var form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) return res.status(400).send(err);
        const token = JSON.parse(fields.token);
        console.log(token)
        if (token == null) return res.status(400).send('Token not found');
        oAuth2Client.setCredentials(token);
        console.log(files.file);
        const drive = google.drive({ version: "v3", auth: oAuth2Client });
        const fileMetadata = {
            name: files.file.name,
        };

        const media = {
            mimeType: files.file.type,
            body: fs.createReadStream(files.file.path),
        };
        drive.files.create(
            {
                resource: fileMetadata,
                media: media,
                fields: "id",
            },
            (err, file) => {
                oAuth2Client.setCredentials(null);
                if (err) {
                    console.error(err);
                    res.status(400).send(err)
                } else {
                    res.send('Successful')
                }
            }
        );
    });
});

app.post('/insertFile', (req, res) => {
    var fileMetadata = {
        'name': 'photo.jpg'
    };
    var media = {
        mimeType: 'image/jpeg',
        body: fs.createReadStream('files/photo.jpg')
    };
    drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    }, function (err, file) {
        if (err) {
            // Handle error
            console.error(err);
        } else {
            console.log('File Id: ', file.id);
        }
    });
})

// app.post('/insertFile', (req, res) => {
//     fileData = req;

//     console.log("---------------------------------------------------");
//     console.log(req.file);
//     console.log(req.fileName);
//     console.log(req.header.Authorization);

//     const boundary = '-------314159265358979323846';
//     const delimiter = "\r\n--" + boundary + "\r\n";
//     const close_delim = "\r\n--" + boundary + "--";

//     var reader = new FileReader();
//     reader.readAsBinaryString(fileData);
//     reader.onload = function (e) {
//         var contentType = fileData.type || 'application/octet-stream';
//         var metadata = {
//             'title': fileData.fileName,
//             'mimeType': contentType
//         };

//         var base64Data = btoa(reader.result);
//         var multipartRequestBody =
//             delimiter +
//             'Content-Type: application/json\r\n\r\n' +
//             JSON.stringify(metadata) +
//             delimiter +
//             'Content-Type: ' + contentType + '\r\n' +
//             'Content-Transfer-Encoding: base64\r\n' +
//             '\r\n' +
//             base64Data +
//             close_delim;

//         var request = gapi.client.request({
//             'path': '/upload/drive/v2/files',
//             'method': 'POST',
//             'params': { Authorization : req.headers.Authorization,'uploadType': 'multipart' },
//             'headers': {
//                 'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
//             },
//             'body': multipartRequestBody
//         });
//         // if (!callback) {
//         //     callback = function (file) {
//         //         console.log(file)
//         //     };
//         // }
//         console.log("Finished");
//     }
// });

app.post('/deleteFile/:id', (req, res) => {
    if (req.body.token == null) return res.status(400).send('Token not found');
    oAuth2Client.setCredentials(req.body.token);
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    var fileId = req.params.id;
    drive.files.delete({ 'fileId': fileId }).then((response) => { res.send(response.data) })
});

app.post('/download/:id', (req, res) => {
    if (req.body.token == null) return res.status(400).send('Token not found');
    oAuth2Client.setCredentials(req.body.token);
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    var fileId = req.params.id;
    drive.files.get({ fileId: fileId, alt: 'media' }, { responseType: 'stream' },
        function (err, response) {
            response.data
                .on('end', () => {
                    console.log('Done');
                })
                .on('error', err => {
                    console.log('Error', err);
                })
                .pipe(res);
        });

});

app.post('/verifyToken', async (req, res) => {
    try {
        const token = req.body.token;

        const client = new OAuth2Client(client_id);

        const login = await client.verifyIdToken({
            idToken: token,
            audience: client_id,
        })

        const payload = login.getPayload();

        //check if the jwt is issued for our client
        const audience = payload.aud;
        if (audience !== client_id) {
            throw new Error(
                'error while authenticating google user: audience mismatch: wanted [' +
                client_id +
                '] but was [' +
                audience +
                ']'
            );
        }
        console.log(payload);

        return payload['email'];
    } catch (e) {
        console.log(e);
    }
})

const port = process.env.PORT || 3000;

app.listen(port, err => {
    if (err) {
        process.exit(-1);
    }
    console.log("Server running on localhost " + port)
});