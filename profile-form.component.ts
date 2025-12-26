import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as AOS from 'aos';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { User, UserService } from '../../services/user.service';

export interface ProfileFormData {
  fullName: string;
  email: string;
  mobile: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.css']
})
export class ProfileFormComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  isSubmitting = false;
  hasUnsavedChanges = false;
  isEmailEditable = false; // Can be made role-based
  private destroy$ = new Subject<void>();
  private autoSaveTimer: any;
  private readonly AUTO_SAVE_DELAY = 3000; // 3 seconds
  private originalFormData: ProfileFormData | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Initialize AOS animations
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 800,
        once: true,
        offset: 100
      });
    }

    // Load user profile data
    this.loadUserProfile();

    // Setup auto-save with debouncing
    this.setupAutoSave();

    // Setup form change detection
    this.setupFormChangeDetection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
  }

  /**
   * Initialize the profile form with validators
   */
  private initializeForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-Z\\s]+$')
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      mobile: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{10}$')
      ]],
      dateOfBirth: [''],
      gender: [''],
      address: ['', [
        Validators.maxLength(200)
      ]]
    });
  }

  /**
   * Load user profile data from service
   */
  private loadUserProfile(): void {
    this.userService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          this.populateForm(user);
          this.originalFormData = this.profileForm.value;
          this.checkEmailEditability(user);
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.toastr.error('Failed to load profile data', 'Error');
        }
      });
  }

  /**
   * Populate form with user data
   */
  private populateForm(user: User): void {
    this.profileForm.patchValue({
      fullName: user.fullName || '',
      email: user.email || '',
      mobile: user.mobile || '',
      dateOfBirth: this.formatDateForInput(user.dateOfBirth),
      gender: user.gender || '',
      address: user.address || ''
    });
  }

  /**
   * Check if email should be editable based on user role/permissions
   */
  private checkEmailEditability(user: User): void {
    // For now, making email non-editable for security
    // This can be made role-based in the future
    this.isEmailEditable = false;
  }

  /**
   * Setup auto-save functionality
   */
  private setupAutoSave(): void {
    this.profileForm.valueChanges
      .pipe(
        debounceTime(this.AUTO_SAVE_DELAY),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.profileForm.valid && this.hasUnsavedChanges) {
          this.autoSave();
        }
      });
  }

  /**
   * Setup form change detection for unsaved changes warning
   */
  private setupFormChangeDetection(): void {
    this.profileForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasUnsavedChanges = this.hasFormChanged();
      });
  }

  /**
   * Check if form has changed from original data
   */
  private hasFormChanged(): boolean {
    if (!this.originalFormData) return false;
    
    const currentData = this.profileForm.value;
    return JSON.stringify(currentData) !== JSON.stringify(this.originalFormData);
  }

  /**
   * Auto-save form data
   */
  private autoSave(): void {
    if (this.isSubmitting) return;

    const formData = this.profileForm.value;
    
    // Save to localStorage for draft recovery
    this.saveProfileDraft(formData);
    
    // Optional: Show subtle notification
    this.toastr.info('Draft auto-saved', 'Auto-save', {
      timeOut: 2000,
      progressBar: false,
      toastClass: 'toast-auto-save'
    });
  }

  /**
   * Save profile draft to localStorage
   */
  private saveProfileDraft(formData: Partial<ProfileFormData>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    try {
      localStorage.setItem('profile_draft', JSON.stringify(formData));
      localStorage.setItem('profile_draft_timestamp', new Date().toISOString());
    } catch (error) {
      console.warn('Failed to save profile draft:', error);
    }
  }

  /**
   * Load profile draft from localStorage
   */
  private loadProfileDraft(): Partial<ProfileFormData> | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    
    try {
      const draft = localStorage.getItem('profile_draft');
      const timestamp = localStorage.getItem('profile_draft_timestamp');
      
      if (draft && timestamp) {
        const draftAge = Date.now() - new Date(timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (draftAge < maxAge) {
          return JSON.parse(draft);
        } else {
          // Clear old draft
          this.clearProfileDraft();
        }
      }
    } catch (error) {
      console.warn('Failed to load profile draft:', error);
    }
    
    return null;
  }

  /**
   * Clear profile draft from localStorage
   */
  private clearProfileDraft(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    localStorage.removeItem('profile_draft');
    localStorage.removeItem('profile_draft_timestamp');
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      this.toastr.error('Please fix the validation errors', 'Validation Error');
      return;
    }

    this.isSubmitting = true;
    const formData = this.profileForm.value;

    // Only send changed fields
    const changedFields = this.getChangedFields(formData);

    this.userService.updateProfile(changedFields)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser: User) => {
          this.isSubmitting = false;
          this.hasUnsavedChanges = false;
          this.originalFormData = this.profileForm.value;
          this.clearProfileDraft();
          
          this.toastr.success('Profile updated successfully!', 'Success');
          
          // Refresh AOS animations
          if (isPlatformBrowser(this.platformId)) {
            AOS.refresh();
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Profile update error:', error);
          this.toastr.error('Failed to update profile. Please try again.', 'Error');
        }
      });
  }

  /**
   * Get only the changed fields from the form
   */
  private getChangedFields(formData: ProfileFormData): Partial<ProfileFormData> {
    if (!this.originalFormData || !formData) return formData;

    const changedFields: Partial<ProfileFormData> = {};
    
    Object.keys(formData).forEach(key => {
      const formKey = key as keyof ProfileFormData;
      if (formData[formKey] !== (this.originalFormData && this.originalFormData[formKey])) {
        changedFields[formKey] = formData[formKey];
      }
    });

    return changedFields;
  }

  /**
   * Reset form to original values
   */
  resetForm(): void {
    if (this.originalFormData && this.profileForm) {
      this.profileForm.patchValue(this.originalFormData);
      this.hasUnsavedChanges = false;
      this.toastr.info('Form reset to original values', 'Reset');
    } else {
      this.profileForm.reset();
      this.hasUnsavedChanges = false;
    }
  }

  /**
   * Navigate to change password page
   */
  navigateToChangePassword(): void {
    // Check for unsaved changes
    if (this.hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/change-password']);
      }
    } else {
      this.router.navigate(['/change-password']);
    }
  }

  /**
   * Get maximum date for date of birth input (18 years ago)
   */
  getMaxDate(): string {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  }

  /**
   * Format date for input field
   */
  private formatDateForInput(date?: Date | string): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
  }

  /**
   * Calculate account age in days
   */
  getAccountAge(): number {
    const user = this.userService.currentUserValue;
    if (!user?.createdAt) return 0;
    
    const createdDate = new Date(user.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Mark all form controls as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Get form control for easier access in template
   */
  get f(): { [key: string]: AbstractControl } {
    return this.profileForm.controls;
  }
}
