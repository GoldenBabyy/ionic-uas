import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/service/auth.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-friend-list',
  templateUrl: './friend-list.page.html',
  styleUrls: ['./friend-list.page.scss'],
})

export class FriendListPage implements OnInit {
  searchName: string;
  userID: string;
  userData: any;
  usersData: any;
  friendsData: any[] = [];
  friendsDataFilter: any;
  userFriends: any[] = [];
  loading: any;

  constructor(
    private authSrv: AuthService,
    private userSrv: UserService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
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
  
  ionViewWillEnter(){
    this.authSrv.userDetails().subscribe(res => {
      if(res !== null){
        this.userID = res.uid;
        this.getAllUser();
      }
    }, err => {
      console.log(err);
    })  
  }

  getAllUser(){
    this.userSrv.getAll().snapshotChanges().pipe(
      map(changes => 
        changes.map(c => ({key: c.payload.key, ...c.payload.val()}))  
      )
    ).subscribe(data => {
      this.friendsData = [];
      this.usersData = data;
      this.getUserDetail();
    });
  }

  getUserDetail(){
    this.userData = this.userSrv.getUserDetail(this.usersData,this.userID);
    if(this.userData.friends){
      this.userFriends = this.userData.friends;
      this.getFriends();
    }
  }

  getFriends(){
    for(let i = 0; i < this.userFriends.length; i++){
      this.friendsData.push(this.userSrv.getUserDetail(this.usersData, this.userFriends[i]));
    }
    
    if(this.userFriends.length == 0)    {
      this.friendsDataFilter = null;
    }else
      this.friendsDataFilter = this.friendsData;
  }

  async presentAlert(id, name){
    const alert = await this.alertCtrl.create({
      header: 'Are you sure?',
      message: 'Do you want to delete '+ name +' from Friend List?',
      buttons:[
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => this.deleteFriends(id)
        }
      ]
    });
    await alert.present();
  }

  async presentLoading(msg: string){
    const loading = await this.loadingCtrl.create({
        message: msg,
        duration: 2000
    });
    await loading.present();

    const {role, data} = await loading.onDidDismiss();
  }

  deleteFriends(id){
    if (id > -1) {
      this.presentLoading("Deleting a friend...").then(() => {
        this.userFriends.splice(id, 1);
        this.userData.friends = this.userFriends;
        this.userSrv.update(this.userID, this.userData);
        this.getFriends();
        this.presentToast();
      });
    }
  }

  filterFriendList(){
    this.friendsDataFilter = this.friendsData.filter(user => {
      var name = user.firstName + ' ' + user.lastName; 
      return name.toLowerCase().includes(this.searchName.toLowerCase());
    })
  }

  searchFriend(){
    if(this.friendsDataFilter){
      if(this.searchName == ''){
        this.friendsDataFilter = this.friendsData;
      }
      else{
        this.filterFriendList();
      }
    }
  }

  onPress(itemID, name){
    this.presentAlert(itemID, name);
  }

  async presentToast() {
    const toast = await this.toastCtrl.create({
      message: 'Delete successfully.',
      duration: 2000,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  }
}
