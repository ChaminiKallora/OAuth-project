import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiCallsService } from 'src/app/api-calls/api-calls.service';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';

import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FileUploadServiceService } from '../file-upload-service/file-upload-service.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit {
  @ViewChild("fileUpload", { static: false }) fileUpload: ElementRef; files = [];

  storedFiles = new Map();

  constructor(
    private activatedRoute: ActivatedRoute,
    private _api: ApiCallsService
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      // get the sent authorization code 
      const code = params['code'];

      // use the authorization code to retrive the access token
      this._api.getToken({ code: code })
        .subscribe(
          res => {
            // store the access token in local storage
            localStorage.setItem('accessToken', res.accessToken);

            // call get files method
            this.getFiles();
          },
          (err: HttpErrorResponse) => {
            console.log("Error - " + err.message);
          }
        )
    })
  }

  // call the getfiles method in the api-calls.service.ts
  getFiles() {
    console.log("get files");
    this._api.getFiles()
      .subscribe(
        res => {
          this.storedFiles = res.items;
        },
        (err: HttpErrorResponse) => {
          console.log("Error - " + err.message);
        }
      )
  }

  // retrive stored files
  showFiles(){
    this.getFiles();
  }

  // upload the user chosen image files to the google drive
  uploadFile(file, type, size) {
    const formData = new FormData();
    formData.append('file', file.data);
    file.inProgress = true;
    this._api.insertFile(file.data, "")
    
    this.files = [];
  }

  // upload files, one by one to the google drive by calling the uploadFile method 
  private uploadFiles() {
    this.fileUpload.nativeElement.value = '';
    this.files.forEach(file => {
      this.uploadFile(file, file.data.type, file.data.size);
    });
  }

  // upload button
  onClick() {
    const fileUpload = this.fileUpload.nativeElement; fileUpload.onchange = () => {
      for (let index = 0; index < fileUpload.files.length; index++) {
        const file = fileUpload.files[index];
        this.files.push({ data: file, inProgress: false, progress: 10 });
      }
      // call uploadFiles method
      this.uploadFiles();
    };
    fileUpload.click();
  }

  // delete selected file
  delete(file){
    const fileName = file.originalFilename;
    this._api.deleteFile(file.id)
      .subscribe(
      res => {
        alert(fileName + " deleted successfully");
        console.log("Refresh");
        this.getFiles();
      },
      err => {
        console.log("Error - " + err.message);
      }
    )
  }

  // log out from the system
  logout(){
    this._api.loggedOut();
  }

}
