import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
  changePasswordForm: FormGroup;
  isSubmitting = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  
  private formSubscription: Subscription | null = null;
  private readonly CHANGE_PASSWORD_DATA_KEY = 'change_password_data';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.changePasswordForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadSavedData();
    this.setupAutoSave();
    this.initializeAOS();
  }

  ngOnDestroy(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      currentPassword: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    
    if (newPassword && form.get('currentPassword')?.value === newPassword) {
      return { sameAsOldPassword: true };
    }
    
    return null;
  }

  private setupAutoSave(): void {
    this.formSubscription = this.changePasswordForm.valueChanges.subscribe(() => {
      this.saveFormData();
    });
  }

  private saveFormData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const formData = this.changePasswordForm.value;
    localStorage.setItem(this.CHANGE_PASSWORD_DATA_KEY, JSON.stringify(formData));
  }

  private loadSavedData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const savedData = localStorage.getItem(this.CHANGE_PASSWORD_DATA_KEY);
    if (savedData) {
      try {
        const formData = JSON.parse(savedData);
        this.changePasswordForm.patchValue(formData);
      } catch (error) {
        console.error('Error loading saved form data:', error);
        this.clearSavedData();
      }
    }
  }

  private clearSavedData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    localStorage.removeItem(this.CHANGE_PASSWORD_DATA_KEY);
  }

  private initializeAOS(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('aos').then((AOS) => {
        AOS.default.init({
          duration: 800,
          easing: 'ease-in-out',
          once: true,
          offset: 100
        });
      });
    }
  }

  getPasswordStrength(password: string): { score: number; label: string; color: string } {
    if (!password) return { score: 0, label: 'Very Weak', color: '#dc3545' };
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Complexity checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    
    const strengthLevels = [
      { score: 0, label: 'Very Weak', color: '#dc3545' },
      { score: 1, label: 'Weak', color: '#fd7e14' },
      { score: 2, label: 'Fair', color: '#ffc107' },
      { score: 3, label: 'Good', color: '#20c997' },
      { score: 4, label: 'Strong', color: '#28a745' },
      { score: 5, label: 'Very Strong', color: '#007bff' },
      { score: 6, label: 'Excellent', color: '#6f42c1' }
    ];
    
    return strengthLevels[Math.min(score, 6)];
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.markFormGroupTouched(this.changePasswordForm);
      this.toastr.error('Please fix all validation errors before submitting.', 'Validation Error');
      return;
    }

    this.isSubmitting = true;
    
    const changePasswordData: ChangePasswordData = this.changePasswordForm.value;
    
    this.authService.changePassword(changePasswordData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.clearSavedData();
        this.changePasswordForm.reset();
        this.toastr.success('Password updated successfully!', 'Success');
        
        // Optional: Redirect to profile or dashboard
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        // Error handling is done in the service
      }
    });
  }

  onCancel(): void {
    this.clearSavedData();
    this.router.navigate(['/profile']);
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.hideCurrentPassword = !this.hideCurrentPassword;
        break;
      case 'new':
        this.hideNewPassword = !this.hideNewPassword;
        break;
      case 'confirm':
        this.hideConfirmPassword = !this.hideConfirmPassword;
        break;
    }
  }

  getErrorMessage(field: string): string {
    const control = this.changePasswordForm.get(field);
    
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
      if (control.errors['minlength']) {
        return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
      }
      if (control.errors['pattern']) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
      }
    }
    
    return '';
  }

  getFormErrorMessage(): string {
    if (this.changePasswordForm.errors?.['passwordMismatch']) {
      return 'New password and confirm password must match';
    }
    if (this.changePasswordForm.errors?.['sameAsOldPassword']) {
      return 'New password cannot be the same as current password';
    }
    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  // Password validation helper methods
  hasLowercase(password: string): boolean {
    return /[a-z]/.test(password);
  }

  hasUppercase(password: string): boolean {
    return /[A-Z]/.test(password);
  }

  hasNumber(password: string): boolean {
    return /\d/.test(password);
  }

  hasSpecialChar(password: string): boolean {
    return /[@$!%*?&]/.test(password);
  }
}
