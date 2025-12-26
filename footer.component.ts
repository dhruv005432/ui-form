import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit, OnDestroy {
  currentYear: number;
  isDarkMode: boolean = false;
  private themeToggleListener?: EventListener;

  constructor(
    private router: Router,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.currentYear = new Date().getFullYear();
    this.initializeTheme();
  }

  ngOnInit(): void {
    this.initializeThemeToggle();
  }

  ngOnDestroy(): void {
    if (this.themeToggleListener && isPlatformBrowser(this.platformId) && typeof document !== 'undefined') {
      document.removeEventListener('click', this.themeToggleListener);
    }
  }

  private initializeTheme(): void {
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      this.isDarkMode = localStorage.getItem('theme') === 'dark';
    }
  }

  private initializeThemeToggle(): void {
    if (isPlatformBrowser(this.platformId) && typeof document !== 'undefined') {
      this.themeToggleListener = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target.id === 'theme-toggle') {
          event.preventDefault();
          this.toggleTheme();
        }
      };
      document.addEventListener('click', this.themeToggleListener);
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    const theme = this.isDarkMode ? 'dark' : 'light';
    
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    
    // Apply theme to body
    if (isPlatformBrowser(this.platformId) && typeof document !== 'undefined') {
      document.body.classList.toggle('dark-theme', this.isDarkMode);
      
      // Update theme toggle icon
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
          icon.className = this.isDarkMode ? 'fas fa-sun me-1' : 'fas fa-moon me-1';
        }
        themeToggle.innerHTML = this.isDarkMode ? 
          '<i class="fas fa-sun me-1"></i>Light Mode' : 
          '<i class="fas fa-moon me-1"></i>Dark Mode';
      }
    }

    this.toastr.success(
      `Switched to ${theme} mode`,
      'Theme Updated',
      { 
        timeOut: 2000,
        positionClass: 'toast-bottom-right'
      }
    );
  }

  onNewsletterSubmit(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    
    if (emailInput && emailInput.value) {
      this.toastr.success(
        'Thank you for subscribing! You will receive updates at ' + emailInput.value,
        'Newsletter Subscription',
        { 
          timeOut: 3000,
          positionClass: 'toast-bottom-right'
        }
      );
      emailInput.value = '';
    } else {
      this.toastr.warning(
        'Please enter a valid email address',
        'Invalid Email',
        { 
          timeOut: 2000,
          positionClass: 'toast-bottom-right'
        }
      );
    }
  }

  navigateToSection(section: string): void {
    if (section.startsWith('/')) {
      this.router.navigate([section]);
    } else {
      // Handle anchor links or other navigation
      console.log('Navigate to:', section);
    }
  }
}