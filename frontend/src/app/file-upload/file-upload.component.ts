import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiCallsService } from 'src/app/api-calls/api-calls.service';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
//import { FileSelectDirective, FileUploader } from 'ng2-file-upload';

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

  // uploader: FileUploader = new FileUploader({ url: url, authToken: this._api.getLocalStorageToken() });

  // attachmentList: any = [];

  // gapi: any;

  //
  @ViewChild("fileUpload", { static: false }) fileUpload: ElementRef; files = [];


  constructor(
    private activatedRoute: ActivatedRoute,
    private _api: ApiCallsService,
    private uploadService: FileUploadServiceService
  ) {
    // this.uploader.onBeforeUploadItem = (item) => {
    //   console.log(item);
    //   item.withCredentials = false;
    // }
    // this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
    //   console.log(item.type);
    //   this.attachmentList.push(JSON.parse(response));
    // }
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      const code = params['code'];
      console.log(code);
      this._api.getToken({ code: code })
        .subscribe(
          res => {
            localStorage.setItem('accessToken', res.accessToken)
            console.log(res.accessToken);

            this.getFiles();
          },
          (err: HttpErrorResponse) => {
            console.log("Error - " + err);
          }
        )
    })


  }

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

  uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file.data);
    file.inProgress = true;
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

  private uploadFiles() {
    this.fileUpload.nativeElement.value = '';
    this.files.forEach(file => {
      this.uploadFile(file);
    });
  }

  onClick() {  
    const fileUpload = this.fileUpload.nativeElement;fileUpload.onchange = () => {  
    for (let index = 0; index < fileUpload.files.length; index++)  
    {  
     const file = fileUpload.files[index];  
     this.files.push({ data: file, inProgress: false, progress: 0});  
    }  
      this.uploadFiles();  
    };  
    fileUpload.click();  
}

}
