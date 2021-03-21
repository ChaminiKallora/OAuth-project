import { Injectable, Injector, Type } from '@angular/core';
import { HttpInterceptor } from '@angular/common/http';
import { ApiCallsService } from 'src/app/api-calls/api-calls.service';

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorsService implements HttpInterceptor {

  constructor(private injector: Injector) { }

  intercept(req, next) {
    let apiCallsService = this.injector.get(ApiCallsService)

    if (apiCallsService.loggedIn()) {
      let tokenizedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${apiCallsService.getLocalStorageToken()}`,
        }
      })

      return next.handle(tokenizedReq);

    }
   
    return next.handle(req);
    
  }
}
