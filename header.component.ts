import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isAdmin = false;
  currentUser: any = null;
  isMobileMenuOpen = false;
  isDropdownOpen = false;
  isScrolled = false;
  currentTime = new Date();

  constructor(
    private router: Router, 
    public authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.initializeAuthStatus();
    this.setupScrollListener();
    this.startClock();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  private initializeAuthStatus(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.currentUser = this.authService.currentUserValue;
    this.isAdmin = this.currentUser?.role === 'admin';
  }

  private setupScrollListener(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', this.onScroll.bind(this));
    }
  }

  private onScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled = window.scrollY > 50;
    }
  }

  private startClock(): void {
    setInterval(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.currentTime = new Date();
      }
    }, 1000);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  onLogout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.isLoggedIn = false;
    this.currentUser = null;
    this.isAdmin = false;
    this.isDropdownOpen = false;
    this.router.navigate(['/login']);
  }

  navigateToProfile(): void {
    this.isDropdownOpen = false;
    this.router.navigate(['/profile']);
  }

  navigateToDashboard(): void {
    if (this.isAdmin) {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.router.navigate(['/user-dashboard']);
    }
  }

  getUserInitials(): string {
    if (!this.currentUser?.fullName) return 'U';
    return this.currentUser.fullName
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  getUserRoleBadge(): string {
    if (this.isAdmin) return 'Admin';
    if (this.isLoggedIn) return 'User';
    return 'Guest';
  }

  formatTime(): string {
    return this.currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatDate(): string {
    return this.currentTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  getNotificationCount(): number {
    // Mock notification count - replace with actual notification service
    return this.isLoggedIn ? Math.floor(Math.random() * 5) : 0;
  }
}