import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Capacitor, Camera, CameraResultType, CameraSource } from '@capacitor/core';
import { Router } from '@angular/router';
import { AlertController, ActionSheetController, LoadingController, Platform, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/service/auth.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  @ViewChild('filePicker', { static: false}) filePickerRef: ElementRef<HTMLInputElement>;
  
  userID: string;
  userData: any =[];
  usersDetail: any;
  userCheckInPos: any = [];
  userCheckIn: any[] = [];
  firstName: string;
  checkIn: string;
  isDesktop: boolean;
  downloadURL: any;
  imageFile: any;
  boolCamera: boolean = null;
  photo: SafeResourceUrl;

  constructor( 
    private authSrv: AuthService,
    private userSrv: UserService,
    private db: AngularFireDatabase,
    private platform: Platform,
    private storage: AngularFireStorage,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private loadingCtrl: LoadingController,
    private router: Router,
  ) { 
   
  }

  ngOnInit() {
    if((this.platform.is('mobile') && this.platform.is('hybrid')) || this.platform.is('desktop')){
      this.isDesktop = true;
    }

    this.authSrv.userDetails().subscribe(res => {
      if(res !== null){
        this.userID = res.uid;
        this.getUserData();
      }
    }, err => {
      console.log(err);
    })
  }

  getUserData(){
    this.db.object('/user/' + this.userID).valueChanges().subscribe(data => {
      this.userData = data;
      this.firstName = this.userData.firstName;
      this.checkIn = this.userData.checkIn;
      if(this.userData.checkIn){
        this.userCheckIn = this.userData.checkIn;
        this.userCheckIn.reverse();
      }
    })
  }

  async presentPhotoFab(){
    const actionSheet = await this.actionSheetCtrl.create({
      animated: true,
      buttons: [
      {
        text: 'Camera',
        icon: 'camera-outline',
        handler: () => {
          this.boolCamera = true;
          this.getPicture('camera');
        }
      },
      {
        text: 'Gallery',
        icon: 'image-outline',
        handler: () => {
          console.log('aa');
          this.getPicture('gallery');
        }
      }]
    });

    await actionSheet.present();
  }

  async getPicture(type: string){
    if(!Capacitor.isPluginAvailable('Camera') || (this.isDesktop && type === 'gallery')){   
      this.filePickerRef.nativeElement.click();
      return;
    }else{
      console.log(this.isDesktop);
      console.log(type);

    }

    const image = await Camera.getPhoto({
      quality: 100,
      width: 400,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      saveToGallery: true 
    });

    this.photo = image.dataUrl;
    this.upload();
  }

  dataURLtoFile(dataurl, filename){
    console.log('bb');
    
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, {type: mime })
  }

  onFileChoose(event: Event){
    const file =  (event.target as HTMLInputElement).files[0];
    const pattern = /image-*/;
    const reader = new FileReader();

    if(!file.type.match(pattern)){
      console.log('File format not supported');
      return;
    }

    reader.onload = () => {
      this.photo = reader.result.toString();
    };
    reader.readAsDataURL(file);
    this.imageFile = file;
    this.upload();
  }

  upload(){
    // const file = this.dataURLtoFile(this.photo, 'file');
    const filePath = 'photos/'+ this.userID +'.jpg';
    this.presentLoading("Update profile picture...");
    // const task = ref.put(file);
    // this.navCtrl.navigateBack('');

    if(this.boolCamera){
      const file = this.dataURLtoFile(this.photo, 'file');
      console.log('file: ', file);
      const ref = this.storage.ref(filePath);
      const task = ref.put(file);
    }
    else{
      this.storage.upload(filePath, this.imageFile);
    }

    const ref = this.storage.ref(filePath);
    ref.getDownloadURL().subscribe(res => {
      this.userData.photo = res;
      this.userSrv.update(this.userID, this.userData);
    })
  }

  LogOut(){
    this.authSrv.logoutUser()
      .then(res => {
          console.log(res);
          this.router.navigateByUrl('/login');
        }).catch(error => {
          console.log(error);
      });
  }

  async presentLoading(msg: string){
    const loading = await this.loadingCtrl.create({
        message: msg,
        duration: 2000
    });
    await loading.present();

    const {role, data} = await loading.onDidDismiss();
  }

  checkOut(id){
    if (id > -1) {
      this.presentLoading('Deleting a feed...').then(() => {
        this.userCheckIn.splice(id, 1);
        this.userData.checkIn = this.userCheckIn;
        this.userSrv.update(this.userID, this.userData);
        this.presentToast();
      });
    }
  }

  onPress(id) {
    this.presentAlert(id);
  }

  async presentAlert(id){
    const alert = await this.alertCtrl.create({
      header: 'Are you sure?',
      message: 'Do you want to delete this feed?',
      buttons:[
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => this.checkOut(id)
        }
      ]
    });
    await alert.present();
  }

  async presentToast() {
    const toast = await this.toastCtrl.create({
      message: 'Delete a feed successfully.',
      duration: 2000,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  }
}
