import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ApiCallsService {

  constructor(private http: HttpClient,
    private _router: Router) { }


  googleLogin(token) {
    return this.http.post<any>("http://localhost:3000/verifyToken", token);
  }

  oAuthService() {
    return this.http.get<any>("http://localhost:3000/getAuthURL");
  }

  getToken(code) {
    return this.http.post<any>("http://localhost:3000/getToken", code);
  }

  getFiles() {
    return this.http.get<any>("https://www.googleapis.com/drive/v2/files");
  }

  uploadFiles(formData) {
    //return this.http.post<any>("http://localhost:3000/insertFile", file);
    return this.http.post<any>("https://www.googleapis.com/upload/drive/v2/files", formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  getUserProfile(){
    return this.http.get<any>("https://www.googleapis.com/oauth2/v1/userinfo?alt=json");
  }

  loggedIn() {
    return !!localStorage.getItem('accessToken');
  }

  getLocalStorageToken() {
    return localStorage.getItem('accessToken');
  }

}
