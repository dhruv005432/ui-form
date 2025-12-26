import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import * as AOS from 'aos';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-Z\\s]+$')
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]],
      mobile: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(15),
        Validators.pattern('^[0-9+\\-\\s()]+$')
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(20),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{6,}$')
      ]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
      });
    }
    this.loadSavedFormData();
  }

  passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get f() {
    return this.registerForm.controls;
  }

  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(field)} is required`;
      }
      if (control.errors['minlength']) {
        return `${this.getFieldLabel(field)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
      if (control.errors['maxlength']) {
        return `${this.getFieldLabel(field)} must not exceed ${control.errors['maxlength'].requiredLength} characters`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['pattern']) {
        return this.getPatternErrorMessage(field);
      }
    }
    return '';
  }

  getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      fullName: 'Full Name',
      email: 'Email Address',
      mobile: 'Mobile Number',
      password: 'Password',
      confirmPassword: 'Confirm Password'
    };
    return labels[field] || field;
  }

  getPatternErrorMessage(field: string): string {
    const messages: { [key: string]: string } = {
      fullName: 'Full Name can only contain letters and spaces',
      email: 'Please enter a valid email address',
      mobile: 'Please enter a valid mobile number',
      password: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    };
    return messages[field] || 'Invalid format';
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  saveFormData(): void {
    if (isPlatformBrowser(this.platformId)) {
      const formData = this.registerForm.value;
      localStorage.setItem('registerFormData', JSON.stringify(formData));
    }
  }

  loadSavedFormData(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedData = localStorage.getItem('registerFormData');
      if (savedData) {
        try {
          const formData = JSON.parse(savedData);
          this.registerForm.patchValue(formData);
        } catch (error) {
          console.error('Error loading saved form data:', error);
          localStorage.removeItem('registerFormData');
        }
      }
    }
  }

  clearSavedFormData(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('registerFormData');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      this.toastr.error('Please fill in all required fields correctly', 'Validation Error');
      return;
    }

    this.isLoading = true;
    this.saveFormData();

    try {
      await this.simulateRegistration();
      
      this.toastr.success('Registration successful! Please login to continue.', 'Success');
      this.clearSavedFormData();
      
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);

    } catch (error) {
      this.toastr.error('Registration failed. Please try again.', 'Error');
    } finally {
      this.isLoading = false;
    }
  }

  private simulateRegistration(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const email = this.registerForm.get('email')?.value;
        
        if (email === 'admin@example.com' || email === 'user@example.com') {
          reject(new Error('Email already exists'));
        } else {
          resolve();
        }
      }, 1500);
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  navigateToLogin(): void {
    this.saveFormData();
    this.router.navigate(['/auth/login']);
  }

  clearForm(): void {
    this.registerForm.reset();
    this.clearSavedFormData();
    this.toastr.info('Form cleared', 'Info');
  }
}