import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import * as AOS from 'aos';
import { ToastrService } from 'ngx-toastr';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'blocked';
  lastActive: Date;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  type: 'login' | 'registration' | 'profile_update' | 'password_change' | 'admin_action' | 'security';
  message: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newRegistrations: number;
  adminAccounts: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, TitleCasePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  users: User[] = [];
  filteredUsers: User[] = [];
  activityLogs: ActivityLog[] = [];
  stats: SystemStats = {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newRegistrations: 0,
    adminAccounts: 0
  };

  // Filters
  searchTerm: string = '';
  roleFilter: string = '';
  statusFilter: string = '';

  // Modal state
  selectedUser: User = {
    id: '',
    name: '',
    email: '',
    role: 'user',
    status: 'active',
    lastActive: new Date(),
    createdAt: new Date()
  };

  private refreshInterval: any;

  constructor(
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeData();
    this.loadCurrentUser();
    this.loadUsers();
    this.loadActivityLogs();
    this.calculateStats();
    this.initializeAOS();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private initializeAOS(): void {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100
    });
  }

  private initializeData(): void {
    // Mock data initialization
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        status: 'active',
        lastActive: new Date(Date.now() - 1000 * 60 * 30),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        status: 'active',
        lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15)
      },
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'user',
        status: 'inactive',
        lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45)
      },
      {
        id: '4',
        name: 'Alice Brown',
        email: 'alice@example.com',
        role: 'user',
        status: 'blocked',
        lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60)
      },
      {
        id: '5',
        name: 'Charlie Wilson',
        email: 'charlie@example.com',
        role: 'user',
        status: 'active',
        lastActive: new Date(Date.now() - 1000 * 60 * 15),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
      }
    ];

    this.users = mockUsers;
    this.filteredUsers = [...mockUsers];

    const mockLogs: ActivityLog[] = [
      {
        id: '1',
        type: 'login',
        message: 'John Doe logged in from 192.168.1.1',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        userId: '1',
        userName: 'John Doe'
      },
      {
        id: '2',
        type: 'registration',
        message: 'New user Charlie Wilson registered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        userId: '5',
        userName: 'Charlie Wilson'
      },
      {
        id: '3',
        type: 'admin_action',
        message: 'Admin John Doe updated user permissions',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        userId: '1',
        userName: 'John Doe'
      },
      {
        id: '4',
        type: 'security',
        message: 'Failed login attempt for alice@example.com',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        userId: '4',
        userName: 'Alice Brown'
      },
      {
        id: '5',
        type: 'profile_update',
        message: 'Jane Smith updated profile information',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
        userId: '2',
        userName: 'Jane Smith'
      }
    ];

    this.activityLogs = mockLogs;
  }

  private loadCurrentUser(): void {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    } else {
      // Fallback admin user
      this.currentUser = {
        id: 'admin-1',
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
        lastActive: new Date(),
        createdAt: new Date()
      };
    }
  }

  private loadUsers(): void {
    // In real app, this would be an API call
    this.calculateStats();
  }

  private loadActivityLogs(): void {
    // In real app, this would be an API call
    // Sort by timestamp descending
    this.activityLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private calculateStats(): void {
    this.stats.totalUsers = this.users.length;
    this.stats.activeUsers = this.users.filter(u => u.status === 'active').length;
    this.stats.inactiveUsers = this.users.filter(u => u.status === 'inactive' || u.status === 'blocked').length;
    this.stats.newRegistrations = this.users.filter(u => 
      new Date(u.createdAt).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 7
    ).length;
    this.stats.adminAccounts = this.users.filter(u => u.role === 'admin').length;
  }

  private startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 60000); // Refresh every minute
  }

  // Public methods
  refreshData(): void {
    this.loadUsers();
    this.loadActivityLogs();
    this.calculateStats();
    this.toastr.info('Dashboard data refreshed', 'System');
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm || 
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesRole = !this.roleFilter || user.role === this.roleFilter;
      const matchesStatus = !this.statusFilter || user.status === this.statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  // User management methods
  editUser(user: User): void {
    this.selectedUser = { ...user };
    // Show modal (would need Bootstrap modal integration)
    this.showModal('userEditModal');
  }

  saveUserChanges(): void {
    const userIndex = this.users.findIndex(u => u.id === this.selectedUser.id);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.selectedUser };
      this.filterUsers();
      this.calculateStats();
      this.addActivityLog('admin_action', `Admin ${this.currentUser?.name} updated user ${this.selectedUser.name}`);
      this.toastr.success('User updated successfully', 'Success');
      this.hideModal('userEditModal');
    }
  }

  toggleUserStatus(user: User): void {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    user.status = newStatus;
    user.lastActive = new Date();
    
    this.calculateStats();
    this.addActivityLog('admin_action', `Admin ${this.currentUser?.name} ${newStatus === 'active' ? 'activated' : 'deactivated'} user ${user.name}`);
    this.toastr.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'Success');
  }

  resetPassword(user: User): void {
    if (confirm(`Are you sure you want to reset password for ${user.name}?`)) {
      // In real app, this would call an API
      this.addActivityLog('admin_action', `Admin ${this.currentUser?.name} reset password for user ${user.name}`);
      this.toastr.success(`Password reset email sent to ${user.email}`, 'Success');
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user ${user.name}? This action cannot be undone.`)) {
      const userIndex = this.users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        this.users.splice(userIndex, 1);
        this.filterUsers();
        this.calculateStats();
        this.addActivityLog('admin_action', `Admin ${this.currentUser?.name} deleted user ${user.name}`);
        this.toastr.success('User deleted successfully', 'Success');
      }
    }
  }

  // Quick action methods
  openAddAdminModal(): void {
    this.toastr.info('Add Admin feature coming soon', 'Quick Actions');
  }

  openBlockUsersModal(): void {
    this.toastr.info('Block Users feature coming soon', 'Quick Actions');
  }

  viewReports(): void {
    this.toastr.info('Reports feature coming soon', 'Quick Actions');
  }

  openSettings(): void {
    this.toastr.info('Settings feature coming soon', 'Quick Actions');
  }

  // Activity log methods
  getLogIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      login: 'fas fa-sign-in-alt',
      registration: 'fas fa-user-plus',
      profile_update: 'fas fa-user-edit',
      password_change: 'fas fa-key',
      admin_action: 'fas fa-shield-alt',
      security: 'fas fa-exclamation-triangle'
    };
    return iconMap[type] || 'fas fa-info-circle';
  }

  private addActivityLog(type: ActivityLog['type'], message: string): void {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      userId: this.currentUser?.id,
      userName: this.currentUser?.name
    };
    this.activityLogs.unshift(newLog);
  }

  // Navigation
  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      this.toastr.success('Logged out successfully', 'Auth');
      this.router.navigate(['/auth/login']);
    }
  }

  // Modal helpers (would integrate with Bootstrap modals)
  private showModal(modalId: string): void {
    // Implementation depends on modal library
    console.log(`Show modal: ${modalId}`);
  }

  private hideModal(modalId: string): void {
    // Implementation depends on modal library
    console.log(`Hide modal: ${modalId}`);
  }
}