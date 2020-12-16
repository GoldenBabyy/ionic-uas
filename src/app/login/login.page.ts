import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  validations_form: FormGroup;
  errorMessage: string = '';
  showPass = false;
  passwordIcon = 'eye-off-outline';

  validation_messages = {
    'email': [
      {type: 'required', message: 'Email is required.'},
      {type: 'pattern', message: 'Enter a valid email.'},
    ],
    'password': [
      {type: 'required', message: 'Password is required.'},
      {type: 'minlength', message: 'Password must be at least 5 characters long.'}
    ]
  };

  constructor(
    private navCtrl: NavController,
    private authSrv: AuthService,
    private formBuilder: FormBuilder,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.validations_form = this.formBuilder.group({
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')        
      ])),
      password: new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(5),
      ])),
    })
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

  loginUser(value){
    this.authSrv.loginUser(value)
    .then(res => {
      console.log(res);;
      this.errorMessage= '';
      this.navCtrl.navigateForward('/home/tabs/maps');
    }, err => {
      this.presentToast("Email or password is incorrect.", "danger");
    });
  }

  goToRegisterPage(){
    this.navCtrl.navigateForward('/register');
  }

  togglePassword(): void {
    this.showPass = !this.showPass;
    if (this.passwordIcon === 'eye-off-outline') {
      this.passwordIcon = 'eye-outline';
    } else {
      this.passwordIcon = 'eye-off-outline';
    }
  }
}
