import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { request } from 'http';
declare var gapi : any;

@Injectable({
  providedIn: 'root'
})
export class ApiCallsService {

  constructor(private http: HttpClient,
    private _router: Router) { }

  googleLogin(token) {
    return this.http.post<any>("http://localhost:3001/verifyToken", token);
  }

  oAuthService() {
    return this.http.get<any>("http://localhost:3001/getAuthURL");
  }

  getToken(code) {
    return this.http.post<any>("http://localhost:3001/getToken", code);
  }

  getFiles() {
    return this.http.get<any>("https://www.googleapis.com/drive/v2/files");
  }

  getUserProfile() {
    return this.http.get<any>("https://www.googleapis.com/oauth2/v1/userinfo?alt=json");
  }

  loggedIn() {
    return !!localStorage.getItem('accessToken');
  }

  loggedOut(){
    localStorage.removeItem('accessToken');
  }

  getLocalStorageToken() {
    return localStorage.getItem('accessToken');
  }

  insertFile(fileData, callback) {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    console.log("name - " + fileData.type);

    const reader = new FileReader();
    reader.readAsBinaryString(fileData);
    reader.onload = function (e) {
      var contentType = fileData.type || 'application/octet-stream';
      var metadata = {
        'title': fileData.name,
        'mimeType': contentType,
      };

      var base64Data = btoa(reader.result as string);
      var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64Data +
        close_delim;

      var request = gapi.client.request({
        'path': '/upload/drive/v2/files',
        'method': 'POST',
        'params': { 'uploadType': 'multipart' },
        'headers': {
          'Authorization': 'Bearer ' + localStorage.getItem('accessToken'),
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody
      });
      if (!callback) {
        callback = function (file) {
          console.log(file)
        };
      }
      request.execute(callback);
    }
  }

  deleteFile(id){
    return this.http.delete<any>("https://www.googleapis.com/drive/v2/files/" + id);
  }

}
