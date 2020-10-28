import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiCallsService } from 'src/app/api-calls/api-calls.service';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';

import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FileUploadServiceService } from '../file-upload-service/file-upload-service.service';

const url = "http://localhost:3000/insertFile";

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit {
  @ViewChild("fileUpload", { static: false }) fileUpload: ElementRef; files = [];


  constructor(
    private activatedRoute: ActivatedRoute,
    private _api: ApiCallsService,
    private uploadService: FileUploadServiceService
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      // get the sent authorization code 
      const code = params['code'];
      
      // use the authorization code to retrive the access token
      this._api.getToken({ code: code })
        .subscribe(
          res => {
            // store the access token in local storage
            localStorage.setItem('accessToken', res.accessToken)
            console.log(res.accessToken);

            // call get files method
            this.getFiles();
          },
          (err: HttpErrorResponse) => {
            console.log("Error - " + err);
          }
        )
    })
  }

  // call the getfiles method in the api-calls.service.ts
  getFiles() {
    this._api.getFiles()
      .subscribe(
        res => {
          console.log(res);
          console.log(res.data);
          res.items.map((file) => {
            console.log(`${file.name} (${file.id})`);
          });
        },
        (err: HttpErrorResponse) => {
          console.log("Error - " + err.message);
        }
      )
  }

  // upload the user chosen image files to the google drive
  uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file.data);
    file.inProgress = true;

    // call the upload files API in api-calls.service.ts
    this._api.uploadFiles(formData).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            file.progress = Math.round(event.loaded * 100 / event.total);
            break;
          case HttpEventType.Response:
            return event;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.log(error);
        file.inProgress = false;
        return of(`${file.data.name} upload failed.`);
      })).subscribe((event: any) => {
        if (typeof (event) === 'object') {
          console.log(event.body);
        }
      });
  }

  // upload files, one by one to the google drive by calling the uploadFile method 
  private uploadFiles() {
    this.fileUpload.nativeElement.value = '';
    this.files.forEach(file => {
      this.uploadFile(file);
    });
  }

  // upload button
  onClick() {  
    const fileUpload = this.fileUpload.nativeElement;fileUpload.onchange = () => {  
    for (let index = 0; index < fileUpload.files.length; index++)  
    {  
     const file = fileUpload.files[index];  
     this.files.push({ data: file, inProgress: false, progress: 0});  
    }  
      // call uploadFiles method
      this.uploadFiles();  
    };  
    fileUpload.click();  
}

}
