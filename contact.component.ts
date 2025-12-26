import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;
  showSuccessMessage = false;

  contactInfo = {
    email: 'support@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business Ave, Suite 100, New York, NY 10001',
    workingHours: 'Monday - Friday: 9:00 AM - 6:00 PM EST'
  };

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.contactForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('aos').then(AOS => {
        AOS.init({
          duration: 800,
          once: true,
          offset: 100
        });
      });
    }
  }

  get formControls() {
    return this.contactForm.controls;
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.markFormGroupTouched(this.contactForm);
      this.showErrorToast();
      return;
    }

    this.isSubmitting = true;

    // Simulate API call
    setTimeout(() => {
      const formData = this.contactForm.value;
      console.log('Contact form submitted:', formData);
      
      this.showSuccessMessage = true;
      this.toastr.success('Message sent successfully! Our team will contact you soon.', 'Success');
      this.resetForm();
      this.isSubmitting = false;

      // Hide success message after 5 seconds
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 5000);
    }, 1500);
  }

  resetForm(): void {
    this.contactForm.reset();
    this.contactForm.markAsPristine();
    this.contactForm.markAsUntouched();
  }

  clearForm(): void {
    this.resetForm();
    this.toastr.info('Form cleared', 'Info');
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  private showErrorToast(): void {
    const errors = [];
    
    if (this.formControls['fullName'].errors) {
      errors.push('Valid full name is required');
    }
    if (this.formControls['email'].errors) {
      errors.push('Valid email address is required');
    }
    if (this.formControls['subject'].errors) {
      errors.push('Subject is required (min 5 characters)');
    }
    if (this.formControls['message'].errors) {
      errors.push('Message is required (min 10 characters)');
    }

    this.toastr.error(errors.join('<br>'), 'Please fix the following errors:', {
      enableHtml: true,
      timeOut: 5000
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.formControls[fieldName];
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['minlength']) {
        return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
      }
      if (control.errors['maxlength']) {
        return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;
      }
    }
    return '';
  }
}