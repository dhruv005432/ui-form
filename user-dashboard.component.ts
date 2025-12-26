import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  
  // User data
  currentUser: any = null;
  userName: string = '';
  userEmail: string = '';
  userMobile: string = '';
  accountStatus: string = 'Active';
  lastLogin: string = '';
  
  // UI State
  isLoading: boolean = false;
  showProfileDropdown: boolean = false;
  
  // Dashboard data
  recentActivities: any[] = [];
  quickActions: any[] = [];
  accountStats: any = {
    totalLogins: 0,
    profileUpdates: 0,
    passwordChanges: 0,
    supportTickets: 0
  };
  
  constructor(
    private router: Router,
    private fb: FormBuilder
  ) {}
  
  ngOnInit(): void {
    this.initializeUserData();
    this.loadDashboardData();
    this.initializeAOS();
  }
  
  ngOnDestroy(): void {
    // Cleanup AOS if needed
  }
  
  /**
   * Initialize user data from localStorage or session
   */
  private initializeUserData(): void {
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        this.userName = this.currentUser.name || this.currentUser.email || 'User';
        this.userEmail = this.currentUser.email || 'user@example.com';
        this.userMobile = this.currentUser.mobile || 'Not provided';
        this.lastLogin = this.currentUser.lastLogin || new Date().toLocaleString();
      } else {
        // Fallback data for demo
        this.userName = 'John Doe';
        this.userEmail = 'user@example.com';
        this.userMobile = '+1 234 567 8900';
        this.lastLogin = new Date().toLocaleString();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.handleSessionError();
    }
  }
  
  /**
   * Load dashboard-specific data
   */
  private loadDashboardData(): void {
    // Initialize quick actions
    this.quickActions = [
      {
        id: 1,
        title: 'View Profile',
        description: 'View your complete profile information',
        icon: 'fas fa-user',
        route: '/profile',
        color: 'primary'
      },
      {
        id: 2,
        title: 'Edit Profile',
        description: 'Update your personal information',
        icon: 'fas fa-edit',
        route: '/profile/edit',
        color: 'secondary'
      },
      {
        id: 3,
        title: 'Change Password',
        description: 'Update your account password',
        icon: 'fas fa-lock',
        route: '/change-password',
        color: 'warning'
      },
      {
        id: 4,
        title: 'Contact Support',
        description: 'Get help from our support team',
        icon: 'fas fa-headset',
        route: '/contact',
        color: 'info'
      }
    ];
    
    // Initialize recent activities
    this.recentActivities = [
      {
        id: 1,
        type: 'login',
        description: 'Successfully logged into your account',
        timestamp: new Date().toLocaleString(),
        icon: 'fas fa-sign-in-alt',
        color: 'success'
      },
      {
        id: 2,
        type: 'profile',
        description: 'Profile information updated',
        timestamp: new Date(Date.now() - 86400000).toLocaleString(),
        icon: 'fas fa-user-edit',
        color: 'info'
      },
      {
        id: 3,
        type: 'password',
        description: 'Password changed successfully',
        timestamp: new Date(Date.now() - 172800000).toLocaleString(),
        icon: 'fas fa-key',
        color: 'warning'
      }
    ];
    
    // Initialize account statistics
    this.accountStats = {
      totalLogins: 42,
      profileUpdates: 5,
      passwordChanges: 2,
      supportTickets: 1
    };
  }
  
  /**
   * Initialize AOS animations
   */
  private initializeAOS(): void {
    if (typeof (window as any).AOS !== 'undefined') {
      (window as any).AOS.refresh();
    }
  }
  
  /**
   * Toggle profile dropdown menu
   */
  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }
  
  /**
   * Handle quick action navigation
   */
  navigateToAction(action: any): void {
    if (action.route) {
      this.isLoading = true;
      setTimeout(() => {
        this.router.navigate([action.route]);
        this.isLoading = false;
      }, 500);
    }
  }
  
  /**
   * Handle profile dropdown actions
   */
  handleProfileAction(action: string): void {
    this.showProfileDropdown = false;
    
    switch (action) {
      case 'profile':
        this.router.navigate(['/profile']);
        break;
      case 'change-password':
        this.router.navigate(['/change-password']);
        break;
      case 'logout':
        this.logout();
        break;
      default:
        break;
    }
  }
  
  /**
   * Handle user logout
   */
  logout(): void {
    this.isLoading = true;
    
    // Clear session data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userToken');
    sessionStorage.clear();
    
    // Show success notification
    this.showNotification('success', 'Logged out successfully');
    
    // Navigate to login
    setTimeout(() => {
      this.router.navigate(['/login']);
      this.isLoading = false;
    }, 1000);
  }
  
  /**
   * Handle session errors
   */
  private handleSessionError(): void {
    this.showNotification('error', 'Session expired. Please login again.');
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }
  
  /**
   * Show notification (to be implemented with ngx-toastr)
   */
  private showNotification(type: string, message: string): void {
    // This will be implemented with ngx-toastr
    console.log(`${type}: ${message}`);
    
    // Fallback to console for now
    if (typeof (window as any).toastr !== 'undefined') {
      switch (type) {
        case 'success':
          (window as any).toastr.success(message);
          break;
        case 'error':
          (window as any).toastr.error(message);
          break;
        case 'warning':
          (window as any).toastr.warning(message);
          break;
        case 'info':
          (window as any).toastr.info(message);
          break;
        default:
          (window as any).toastr.info(message);
      }
    }
  }
  
  /**
   * Get welcome message based on time of day
   */
  getWelcomeMessage(): string {
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    
    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 18) {
      greeting = 'Good afternoon';
    }
    
    return `${greeting}, ${this.userName}!`;
  }
  
  /**
   * Format activity timestamp
   */
  formatActivityTimestamp(timestamp: string): string {
    const activityDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - activityDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  }
  
  /**
   * Get account status badge class
   */
  getAccountStatusClass(): string {
    return this.accountStatus.toLowerCase() === 'active' ? 'badge-success' : 'badge-warning';
  }
  
  /**
   * Get action card color class
   */
  getActionCardClass(color: string): string {
    const colorMap: { [key: string]: string } = {
      'primary': 'text-primary',
      'secondary': 'text-secondary',
      'success': 'text-success',
      'danger': 'text-danger',
      'warning': 'text-warning',
      'info': 'text-info'
    };
    
    return colorMap[color] || 'text-primary';
  }
  
  /**
   * Get activity icon color class
   */
  getActivityIconClass(color: string): string {
    const colorMap: { [key: string]: string } = {
      'success': 'text-success',
      'info': 'text-info',
      'warning': 'text-warning',
      'danger': 'text-danger'
    };
    
    return colorMap[color] || 'text-info';
  }
}