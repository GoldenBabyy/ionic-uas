import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/service/auth.service';
import { UserService } from 'src/app/service/user.service';

declare var google: any;

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
})
export class MapsPage implements OnInit {
  map: any;
  infoWindow: any = new google.maps.InfoWindow();
  boolCheckIn: boolean = false;
  userPos: {lat: number, lng: number} = {lat: 0, lng: 0};
  lat: number;
  lng: number;
  interval: any = null;
  checkInName: string = "";
  userID: string;
  userDetail: any;
  usersDetail: any;
  userCheckInPos: any[] = [];
  friends: any[] = [];
  friendsData: any[] = [];

  @ViewChild('map', {read: ElementRef, static: false}) mapRef: ElementRef;
  curPos: any = {
    lat: -6.256081,
    lng: 106.618755
  }
  
  constructor(
    private toastCtrl : ToastController,
    private authSrv: AuthService,
    private userSrv: UserService,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.authSrv.userDetails().subscribe(res => {
      if(res !== null){
        this.userID = res.uid;
        this.getAllUser();
      }
    }, err => {
      console.log(err);
    })
  }

  ionViewDidEnter(){
    this.showMap(this.curPos);

    if(this.friendsData.length > 0){
      this.getFriendsLocation();
    }
  }

  getAllUser(){
    this.userSrv.getAll().snapshotChanges().pipe(
      map(changes => 
        changes.map(c => ({key: c.payload.key, ...c.payload.val()}))  
      )
    ).subscribe(data => {
      this.friendsData = [];
      this.usersDetail = data;
      this.getUserDetail();
    });
  }

  getUserDetail(){
    this.userDetail = this.userSrv.getUserDetail(this.usersDetail, this.userID);
    if(this.userDetail.friends){
      this.friends = this.userDetail.friends;
      this.getFriendData();
    }
  }

  getFriendData(){
    for(let i = 0; i < this.friends.length; i++){
      this.friendsData.push(this.userSrv.getUserDetail(this.usersDetail, this.friends[i]));
    }
    this.getFriendsLocation();
  }

  getFriendsLocation(){
    for(let i = 0; i < this.friendsData.length; i++){      
      if(this.friendsData[i].checkIn){
        var friendLoc = this.friendsData[i].checkIn[this.friendsData[i].checkIn.length-1];
        const lastCheckInLoc = new google.maps.LatLng(friendLoc.lat, friendLoc.lng);

        const marker = new google.maps.Marker({
          position: lastCheckInLoc,
          map: this.map,
          clickable: true
        });
        marker.info = new google.maps.InfoWindow({
          content: this.friendsData[i].firstName + ' ' + this.friendsData[i].lastName
        });
        google.maps.event.addListener(marker, 'click', function() {
          marker.info.open(map, marker);
        });
      }
    }
  }

  async showCurrentLoc(){
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition((position: Position) => {
        this.userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        this.lat = this.userPos.lat;
        this.lng = this.userPos.lng;
        const marker = new google.maps.Marker({
          position: this.userPos,
          map: this.map,
          animation: google.maps.Animation.DROP
        });
        marker.info = new google.maps.InfoWindow({
          content: 'Me'
        });
        google.maps.event.addListener(marker, 'click', function() {
          marker.info.open(map, marker);
        });
        
        this.map.setCenter(this.userPos);
      });
    }
  } 

  showMap(pos: any){
    const location = new google.maps.LatLng(pos.lat, pos.lng);
    const options = {
      center: location, 
      zoom: 12,
      disableDefaultUI: true
    };

    this.lat = pos.lat;
    this.lng = pos.lng; 

    this.map = new google.maps.Map(this.mapRef.nativeElement, options);
  } 

  toggleCheckIn(){
    this.boolCheckIn = !this.boolCheckIn;
  }

  async addCheckIn() {
    this.showCurrentLoc();
    var currTime = new Date();
  
    var newPos : any = {
      lat: this.userPos.lat,
      lng: this.userPos.lng,
      namaCheckIn: this.checkInName,
      tanggalCheckIn: currTime.toLocaleString()
    }
    this.userCheckInPos.push(newPos);

    if(this.userDetail.checkIn)
      this.userDetail.checkIn.push(newPos)
    else
      this.userDetail.checkIn = this.userCheckInPos;    

    this.userSrv.update(this.userID, this.userDetail);
    this.checkInName= "";
    this.toggleCheckIn();
    this.presentToast("Check In history added. ", "success");
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
}
