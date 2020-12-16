import { Component, OnInit } from '@angular/core';
import { ToastController, LoadingController } from '@ionic/angular';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/service/auth.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-add',
  templateUrl: './add.page.html',
  styleUrls: ['./add.page.scss'],
})
export class AddPage implements OnInit {
  searchEmail: string;
  userID: string;
  userData: any;
  usersData: any;
  userFriends: any[] = [];
  searchedFriend: any;
  isUser: boolean = false;
  isFriend: boolean = false;

  constructor(
    private authSrv: AuthService,
    private userSrv: UserService,
    private toastCtrl: ToastController,
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

  getAllUser(){
    this.userSrv.getAll().snapshotChanges().pipe(
      map(changes => 
        changes.map(c => ({key: c.payload.key, ...c.payload.val()}))  
      )
    ).subscribe(data => {
      this.usersData = data;
      this.getUserData();
    });
  }

  getUserData(){
    this.userData = this.usersData.find(user => {
      return user.key === this.userID;
    });
    if(this.userData.friends){
      this.userFriends = this.userData.friends;
    }
  }
  
  searchFriend(){
    console.log('a');
    
    if(this.searchEmail != ''){
      this.searchedFriend = this.getSearchedFriend(this.searchEmail);
      console.log(this.searchedFriend);
      
      
      if(JSON.stringify(this.searchedFriend) === '{}'){
        this.isUser = false;
        this.presentToast("User not found.", "danger");
      }
      else{
        this.isUser = true;
        if(this.userData.friends){
          this.checkUserFriends();
        }
      }
      console.log(this.isUser);
    }
  }

  getSearchedFriend(searchedEmail: string){
    return{...this.usersData.find(user => {
      return (user.email.toLowerCase() === searchedEmail.toLowerCase()) && (user.key != this.userID);
    })};
  }

  checkUserFriends(){
    var friendID = this.userFriends.indexOf(this.searchedFriend.key);
    if(friendID == -1){
      this.isFriend = false;
    }
    else{
      this.isFriend = true;
    }
    console.log(this.isFriend);
  }

  async presentToast(toastMsg: string, colorMsg: string) {
    const toast = await this.toastCtrl.create({
      message: toastMsg,
      duration: 2000,
      position: 'bottom',
      color: colorMsg,
    });
    await toast.present();
  }

  async presentLoading(){
    const loading = await this.loadingCtrl.create({
        message: "Adding a Friend...",
        duration: 1000
    });
    await loading.present();

    const {role, data} = await loading.onDidDismiss();
  }
 
  addFriend(){
    this.presentLoading().then(() => {
      this.userFriends.push(this.searchedFriend.key);
      this.userData.friends = this.userFriends;
      this.userSrv.update(this.userID, this.userData);
      this.isFriend = true;
      this.presentToast("User success added a friend to friend list", "success");
    });
  }
}
