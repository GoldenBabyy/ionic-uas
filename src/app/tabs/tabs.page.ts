import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../service/auth.service';
import { UserService } from '../service/user.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage implements OnInit {
  private userID: string;
  private user: any;
  private userCheckIn: any = [];
  private lat: number;
  private lng: number;
  private isCheckIn: boolean = false;
  private intervalAuto: any = null;

  constructor(
    private authSrv: AuthService,
    private router: Router,
    private db: AngularFireDatabase,
    private userSrv: UserService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) { }

  ngOnInit() {
    this.authSrv.userDetails().subscribe(res => {
      if(res !== null){
        this.userID = res.uid;
        this.getUser();
        this.intervalAuto = setInterval(() => {
          this.autoGetCurrentLoc('Automatic Check-In');
        }, 600000)
      }
      else{
        this.router.navigateByUrl('/login');
      }
    }, err => {
      console.log(err);
    })
  }

  getUser(){
    this.db.object('/user/' + this.userID).valueChanges().subscribe(data => {
      this.user = data;
      if(this.user.locations){
        this.userCheckIn = this.user.checkIn;
      }
      if(this.isCheckIn == false){
        this.isCheckIn = true;
      }
    });
  }

  async autoGetCurrentLoc(msg: string){
    this.presentLoading(msg).then(() => {
      if(navigator.geolocation){
        var currTime = new Date();

        navigator.geolocation.getCurrentPosition((position: Position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          var newPos : any = {
            lat: userPos.lat,
            lng: userPos.lng,
            namaCheckIn: msg,
            tanggalCheckIn: currTime.toLocaleString()
          }

          this.lat = userPos.lat;
          this.lng = userPos.lng;

          this.userCheckIn.push(newPos);

          if(this.user.checkIn)
            this.user.checkIn.push(newPos)
          else
          this.user.checkIn= this.userCheckIn;

          this.userSrv.update(this.userID, this.user);
        });
      }
    });
  } 
  
  async presentToast(toastMessage: string, colorMessage: string) {
    const toast = await this.toastCtrl.create({
      message: toastMessage,
      duration: 2000,
      position: 'bottom',
      color: colorMessage,
    });
    await toast.present();
  }
  
  async presentLoading(msg){
    const loading = await this.loadingCtrl.create({
        message: msg,
        duration: 2000
    });
    await loading.present();

    const {role, data} = await loading.onDidDismiss();
  }

  ngOnDestroy(){ 
    clearInterval(this.intervalAuto);
  }
}
