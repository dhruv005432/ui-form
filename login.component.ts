import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import * as AOS from 'aos';
import { Subscription } from 'rxjs';
import { AuthService, LoginData } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  rememberMe = false;
  private loginSubscription?: Subscription;

  @ViewChild('loginBtn') loginBtn!: ElementRef<HTMLButtonElement>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit(): void {
    this.loadSavedData();
    this.setupFormListeners();
    // Initialize button state
    this.updateButtonState();
    // Refresh AOS animations for this component
    setTimeout(() => {
      AOS.refresh();
    }, 100);
  }

  ngOnDestroy(): void {
    this.loginSubscription?.unsubscribe();
  }

  ngAfterViewInit(): void {
    // Initialize button state after view is ready
    this.updateButtonState();
  }

  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
      submitButton: [{ value: 'Submit', disabled: true }]
    });
  }

  private setupFormListeners(): void {
    this.loginSubscription = this.loginForm.valueChanges.subscribe(() => {
      this.saveFormData();
      this.updateButtonState();
    });
  }

  private loadSavedData(): void {
    const savedData = this.authService.getLoginData();
    if (savedData) {
      this.loginForm.patchValue({
        email: savedData.email || '',
        password: savedData.password || '',
        rememberMe: savedData.rememberMe || false
      });
      this.rememberMe = savedData.rememberMe || false;
    }
  }

  private saveFormData(): void {
    if (this.rememberMe) {
      this.authService.saveLoginData({
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value,
        rememberMe: this.rememberMe
      });
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    const loginData: LoginData = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value,
      rememberMe: this.loginForm.get('rememberMe')?.value
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.redirectBasedOnRole(response.user.role);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
      }
    });
  }

  private redirectBasedOnRole(role?: string): void {
    switch (role?.toLowerCase()) {
      case 'admin':
        this.router.navigate(['/admin-dashboard']);
        break;
      case 'user':
      default:
        this.router.navigate(['/user-dashboard']);
        break;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onRememberMeChange(event: any): void {
    this.rememberMe = event.target.checked;
    if (!this.rememberMe) {
      this.authService.clearLoginData();
    } else {
      this.saveFormData();
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email address',
      password: 'Password'
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  private updateButtonState(): void {
    const submitControl = this.loginForm.get('submitButton');
    if (submitControl) {
      const shouldDisable = this.loginForm.invalid || this.isLoading;
      if (shouldDisable) {
        submitControl.disable();
      } else {
        submitControl.enable();
      }
    }
  }

  get email(): AbstractControl | null {
    return this.loginForm.get('email');
  }

  get password(): AbstractControl | null {
    return this.loginForm.get('password');
  }

  get rememberMeControl(): AbstractControl | null {
    return this.loginForm.get('rememberMe');
  }
}