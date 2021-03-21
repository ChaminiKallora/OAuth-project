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

const SCOPE = ['https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file ']

app.use(cors());
app.use(express.json());

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

const port = process.env.PORT || 3001;

app.listen(port, err => {
    if (err) {
        process.exit(-1);
    }
    console.log("Server running on localhost " + port)
});