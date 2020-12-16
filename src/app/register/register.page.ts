import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../service/auth.service';
import { UserService } from '../service/user.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  validations_form: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  userID : string;
  showPass = false;
  passwordIcon = 'eye-off-outline';

  validation_messages = {
    'firstName': [
      {type: 'required', message: 'First Name is required.'}
    ],
    'email': [
      {type: 'required', message: 'Email is required.'},
      {type: 'pattern', message: 'Enter a valid email.'},
    ],
    'password': [
      {type: 'required', message: 'Password is required.'},
      {type: 'minlength', message: 'Password must be at least 5 characters long.'},
    ],
    'confirmPassword': [
      {type: 'required', message: 'Password is required.'},
      {type: 'minlength', message: 'Password must be at least 5 characters long.'},
      {type: 'passwordNotMatch', message: 'Password is not match'},
    ]
  };

  constructor(
    private navCtrl: NavController,
    private authSrv: AuthService,
    private formBuilder: FormBuilder,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private userSrv: UserService
  ) { }

  ngOnInit() {
    this.validations_form = this.formBuilder.group({
      firstName: new FormControl('', Validators.compose([
        Validators.required
      ])),
      lastName: new FormControl(''),
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')        
      ])),
      password: new FormControl('', Validators.compose([
        Validators.minLength(5),
        Validators.required,
      ])),
      confirmPassword: new FormControl('', Validators.compose([
        Validators.minLength(5),
        Validators.required,
      ])),
    }, 
      { 
        validators: this.matchPassword.bind(this)
      });
  }

  matchPassword (formGroup: FormGroup) {
    const { value: password } = formGroup.get('password');
    const { value: confirmPassword } = formGroup.get('confirmPassword');
    return password === confirmPassword ? null : { passwordNotMatch: true };
  }

  async presentLoading() {
    const loading = await this.loadingCtrl.create({
      message: 'Registering Account...',
      duration: 2000,
    });
    await loading.present();

    const { role, data } = await loading.onDidDismiss();
    console.log('Loading dismissed!');
  }

  async presentToast(toastMsg: string, colorMsg: string) {
    const toast = await this.toastCtrl.create({
      message: toastMsg,
      duration: 3000,
      position: 'bottom',
      color: colorMsg,
    });
    await toast.present();
  }

  addUser(){
    this.validations_form.value.password = null;
    this.validations_form.value.confirmPassword = null;
    if(this.validations_form.value.lastName == null){
      this.validations_form.value.lastName ='';
    }
    this.userSrv.create(this.userID, this.validations_form.value);
    this.router.navigateByUrl('login');
    this.presentToast("Register Successful, Please Log in.", "success");
  }

  tryRegister(value){
    if(this.validations_form.valid){
      this.authSrv.registerUser(value)
      .then(res => {
        this.userID = res.user.uid;
        this.addUser();
        this.successMessage="Your account has been created. Please log in.";
      }, err => {
        console.log(err);
        this.successMessage = '';
        this.presentToast("Email has been registered", "warning");
      });    
    }
  }

  goLoginPage(){
    this.navCtrl.navigateBack('/login');
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

