// user.service.ts
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id?: string;
  fullName: string;
  email: string;
  mobile: string;
  role?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  dateOfBirth?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  password?: string;
  gender?: string;
  address?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegistrationData {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  terms?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:3000/api';
  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_DATA_KEY = 'user_data';
  private readonly REGISTRATION_DATA_KEY = 'registration_data';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadCurrentUser();
  }

  /**
   * Register a new user
   */
  register(userData: Omit<User, 'id'> & { password: string }): Observable<User> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, userData).pipe(
      tap(({ user, token, refreshToken }) => {
        this.saveAuthData(token, refreshToken, user);
        this.clearRegistrationData();
        this.toastr.success('Registration successful!', 'Success');
      }),
      map(response => response.user),
      catchError(error => {
        // If server is not available, simulate successful registration for demo purposes
        if (error.status === 0) {
          console.log('Server not available, simulating registration for demo');
          
          // Create mock user
          const mockUser: User = {
            id: Date.now().toString(),
            fullName: userData.fullName,
            email: userData.email,
            mobile: userData.mobile,
            createdAt: new Date().toISOString(),
            isActive: true,
            isEmailVerified: false,
            role: 'user'
          };
          
          // Save mock auth data
          this.saveAuthData('mock-jwt-token-' + Date.now(), 'mock-refresh-token-' + Date.now(), mockUser);
          this.clearRegistrationData();
          this.toastr.success('Registration successful! (Demo Mode)', 'Success');
          
          return of(mockUser);
        }
        return this.handleError('Registration')(error);
      })
    );
  }

  /**
   * Save registration form data to localStorage (auto-save)
   * @param formData Form data to save
   */
  saveRegistrationData(formData: Partial<RegistrationData>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const existingData = this.getRegistrationData();
    const updatedData = { ...existingData, ...formData };
    localStorage.setItem(this.REGISTRATION_DATA_KEY, JSON.stringify(updatedData));
  }

  /**
   * Get saved registration data
   * @returns Saved registration data or empty object
   */
  getRegistrationData(): Partial<RegistrationData> {
    if (!isPlatformBrowser(this.platformId)) return {};
    const data = localStorage.getItem(this.REGISTRATION_DATA_KEY);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Clear saved registration data
   */
  clearRegistrationData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.REGISTRATION_DATA_KEY);
  }

  /**
   * Refresh access token
   * @returns Observable with new tokens
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, { refreshToken }).pipe(
      tap(({ token, refreshToken: newRefreshToken }) => {
        this.updateTokens(token, newRefreshToken);
      }),
      catchError(this.handleError('Token Refresh'))
    );
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get current user token
   */
  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get current user profile
   */
  getProfile(): Observable<User> {
    return this.http.get<{ user: User }>(`${this.API_URL}/users/me`).pipe(
      map(response => {
        const user = response.user;
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError(this.handleError('Fetching profile'))
    );
  }

  /**
   * Update user profile
   */
  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.patch<{ user: User }>(`${this.API_URL}/users/me`, userData).pipe(
      tap(response => {
        const user = response.user;
        this.currentUserSubject.next(user);
        this.toastr.success('Profile updated successfully!', 'Success');
      }),
      map(response => response.user),
      catchError(this.handleError('Updating profile'))
    );
  }

  /**
   * Save profile form data to localStorage (auto-save)
   * @param formData Form data to save
   */
  saveProfileDraft(formData: Partial<User>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const existingData = this.getProfileDraft();
    const updatedData = { ...existingData, ...formData };
    localStorage.setItem('profile_draft', JSON.stringify(updatedData));
    localStorage.setItem('profile_draft_timestamp', new Date().toISOString());
  }

  /**
   * Get saved profile draft data
   * @returns Saved profile draft data or empty object
   */
  getProfileDraft(): Partial<User> {
    if (!isPlatformBrowser(this.platformId)) return {};
    const data = localStorage.getItem('profile_draft');
    return data ? JSON.parse(data) : {};
  }

  /**
   * Clear saved profile draft data
   */
  clearProfileDraft(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem('profile_draft');
    localStorage.removeItem('profile_draft_timestamp');
  }

  /**
   * Check if profile draft exists and is recent (within 24 hours)
   */
  hasRecentProfileDraft(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const timestamp = localStorage.getItem('profile_draft_timestamp');
    if (!timestamp) return false;

    const draftAge = Date.now() - new Date(timestamp).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return draftAge < maxAge;
  }

  /**
   * Change user password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/users/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      tap(() => {
        this.toastr.success('Password changed successfully!', 'Success');
      }),
      catchError(this.handleError('Changing password'))
    );
  }

  /**
   * Delete user account
   */
  deleteAccount(password: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/users/me`, {
      body: { password }
    }).pipe(
      tap(() => {
        this.clearAuthData();
        this.toastr.success('Your account has been deleted', 'Account Deleted');
      }),
      catchError(this.handleError('Deleting account'))
    );
  }

  /**
   * Get current user value
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Save authentication data to localStorage
   */
  private saveAuthData(token: string, refreshToken: string, user: User): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Update tokens
   */
  private updateTokens(token: string, refreshToken: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Clear authentication data
   */
  public clearAuthData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Load current user from localStorage
   */
  private loadCurrentUser(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const userData = localStorage.getItem(this.USER_DATA_KEY);
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearAuthData();
      }
    }
  }

  /**
   * Admin: Get all users
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<{ users: User[] }>(`${this.API_URL}/admin/users`).pipe(
      map(response => response.users),
      catchError(this.handleError('Fetching all users'))
    );
  }

  /**
   * Admin: Create new user
   */
  createUser(userData: Omit<User, 'id'> & { password: string }): Observable<User> {
    return this.http.post<{ user: User }>(`${this.API_URL}/admin/users`, userData).pipe(
      tap(response => {
        this.toastr.success('User created successfully!', 'Success');
      }),
      map(response => response.user),
      catchError(this.handleError('Creating user'))
    );
  }

  /**
   * Admin: Update user
   */
  updateUser(userId: string, userData: Partial<User>): Observable<User> {
    return this.http.patch<{ user: User }>(`${this.API_URL}/admin/users/${userId}`, userData).pipe(
      tap(response => {
        this.toastr.success('User updated successfully!', 'Success');
      }),
      map(response => response.user),
      catchError(this.handleError('Updating user'))
    );
  }

  /**
   * Admin: Delete user
   */
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/admin/users/${userId}`).pipe(
      tap(() => {
        this.toastr.success('User deleted successfully!', 'Success');
      }),
      catchError(this.handleError('Deleting user'))
    );
  }

  /**
   * Admin: Toggle user status (activate/deactivate)
   */
  toggleUserStatus(userId: string): Observable<User> {
    return this.http.patch<{ user: User }>(`${this.API_URL}/admin/users/${userId}/toggle-status`, {}).pipe(
      tap(response => {
        const status = response.user.isActive ? 'activated' : 'deactivated';
        this.toastr.success(`User ${status} successfully!`, 'Success');
      }),
      map(response => response.user),
      catchError(this.handleError('Toggling user status'))
    );
  }

  /**
   * Admin: Reset user password
   */
  resetUserPassword(userId: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/admin/users/${userId}/reset-password`, {}).pipe(
      tap(() => {
        this.toastr.success('Password reset link sent successfully!', 'Success');
      }),
      catchError(this.handleError('Resetting user password'))
    );
  }

  /**
   * Admin: Get dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API_URL}/admin/dashboard/stats`).pipe(
      catchError(this.handleError('Fetching dashboard stats'))
    );
  }

  /**
   * Admin: Get system activity logs
   */
  getActivityLogs(filter?: string): Observable<ActivityLog[]> {
    const url = filter ? `${this.API_URL}/admin/activity-logs?type=${filter}` : `${this.API_URL}/admin/activity-logs`;
    return this.http.get<{ logs: ActivityLog[] }>(url).pipe(
      map(response => response.logs),
      catchError(this.handleError('Fetching activity logs'))
    );
  }

  /**
   * Admin: Assign user role
   */
  assignUserRole(userId: string, role: string): Observable<User> {
    return this.http.patch<{ user: User }>(`${this.API_URL}/admin/users/${userId}/role`, { role }).pipe(
      tap(response => {
        this.toastr.success(`User role updated to ${role}!`, 'Success');
      }),
      map(response => response.user),
      catchError(this.handleError('Assigning user role'))
    );
  }

  /**
   * Admin: Block multiple users
   */
  blockUsers(userIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/admin/users/block`, { userIds }).pipe(
      tap(() => {
        this.toastr.success('Users blocked successfully!', 'Success');
      }),
      catchError(this.handleError('Blocking users'))
    );
  }

  /**
   * Admin: Unblock multiple users
   */
  unblockUsers(userIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/admin/users/unblock`, { userIds }).pipe(
      tap(() => {
        this.toastr.success('Users unblocked successfully!', 'Success');
      }),
      catchError(this.handleError('Unblocking users'))
    );
  }

  /**
   * Admin: Export user data
   */
  exportUsers(format: 'csv' | 'excel' | 'json' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.API_URL}/admin/users/export?format=${format}`, {
      responseType: 'blob'
    }).pipe(
      tap(() => {
        this.toastr.success('User data exported successfully!', 'Success');
      }),
      catchError(this.handleError('Exporting user data'))
    );
  }

  /**
   * Admin: Get system health
   */
  getSystemHealth(): Observable<SystemHealth> {
    return this.http.get<SystemHealth>(`${this.API_URL}/admin/system/health`).pipe(
      catchError(this.handleError('Fetching system health'))
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(operation = 'operation') {
    return (error: HttpErrorResponse) => {
      console.error(`${operation} failed:`, error);

      let errorMessage = 'An error occurred. Please try again later.';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        if (error.status === 0) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
          this.clearAuthData();
        } else if (error.status === 403) {
          errorMessage = 'Access denied. Admin privileges required.';
        }
      }
      
      this.toastr.error(errorMessage, `${operation} Failed`);
      return throwError(() => new Error(errorMessage));
    };
  }
}

// Additional interfaces for admin functionality
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  newUsersToday: number;
  activePercentage: number;
  inactivePercentage: number;
  adminPercentage: number;
}

export interface ActivityLog {
  id: string;
  type: string;
  action: string;
  user: string;
  details: string;
  timestamp: Date;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  databaseStatus: string;
  lastCheck: Date;
}