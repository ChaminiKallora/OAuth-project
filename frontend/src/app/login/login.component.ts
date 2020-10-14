import { Component, OnInit } from '@angular/core';
import { GoogleLoginProvider, AuthService } from "angularx-social-login";
import { HttpErrorResponse } from '@angular/common/http';
import { ApiCallsService } from 'src/app/api-calls/api-calls.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  err: any;
  link: String;

  constructor(
    private _socialAuthService: AuthService,
    private _api: ApiCallsService
  ) { }

  ngOnInit() {
  }

  googleLogin() {
    // this._socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID).then((data) => {
    //   console.log(data);
    //   this.loginUser(data);
    // }).catch(
    //   (err) => {
    //     this.err = err;
    //   }
    // )
    this._api.oAuthService()
      .subscribe(
        res => {
          window.open(res.authUrl, "_self");
        }, err => {
          console.log(err);
        }
      );

  }

  loginUser(data) {
    const email = data.email;
    this._api.googleLogin({ token: data.idToken })
      .subscribe(
        res => {
          localStorage.setItem('token', res.token)
          localStorage.setItem('email', email)
        },
        (err: HttpErrorResponse) => {
          console.log("Error - " + err);
        }
      )
  }

}
