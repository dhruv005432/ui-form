import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterModule],
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
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initializeAuthStatus();
    this.setupScrollListener();
    this.startClock();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  private initializeAuthStatus(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.currentUser = this.authService.currentUserValue;
    this.isAdmin = this.currentUser?.role === 'admin';
  }

  private setupScrollListener(): void {
    window.addEventListener('scroll', this.onScroll.bind(this));
  }

  private onScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  private startClock(): void {
    setInterval(() => {
      this.currentTime = new Date();
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
