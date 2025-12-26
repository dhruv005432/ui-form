// auth.service.ts
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

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
  username?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordData {
  email: string;
  mobile?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RegistrationData {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  terms: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api';
  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_DATA_KEY = 'user_data';
  private readonly REGISTRATION_DATA_KEY = 'registration_data';
  private readonly LOGIN_DATA_KEY = 'login_data';
  private readonly FORGOT_PASSWORD_DATA_KEY = 'forgot_password_data';
  private readonly CHANGE_PASSWORD_DATA_KEY = 'change_password_data';
  private readonly SESSION_TIMEOUT_KEY = 'session_timeout';
  private readonly WARNING_TIMEOUT_KEY = 'warning_timeout';

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private sessionTimeoutTimer: any;
  private warningTimeoutTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.initializeSessionTimeout();
  }

  /**
   * Login user
   */
  login(loginData: LoginData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, {
      email: loginData.email,
      password: loginData.password
    }).pipe(
      tap(({ user, token, refreshToken }) => {
        this.saveAuthData(token, refreshToken, user);
        this.setupSessionTimeout();
      }),
      catchError(error => {
        if (error.status === 0) {
          return this.simulateLogin(loginData);
        }
        return this.handleError('Login')(error);
      })
    );
  }

  /**
   * Simulate login for demo purposes
   */
  private simulateLogin(loginData: LoginData): Observable<AuthResponse> {
    const mockUsers = [
      {
        id: '1',
        fullName: 'Admin User',
        email: 'admin@example.com',
        username: 'admin',
        mobile: '+1234567890',
        role: 'admin',
        password: 'admin123',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        fullName: 'John Doe',
        email: 'user@example.com',
        username: 'johndoe',
        mobile: '+0987654321',
        role: 'user',
        password: 'user123',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        username: 'janesmith',
        mobile: '+1122334455',
        role: 'user',
        password: 'password123',
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        fullName: 'Dev User',
        email: 'dev5588@gmail.com',
        username: 'dev5588',
        mobile: '+1234567890',
        role: 'user',
        password: 'Dev@2006',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date().toISOString()
      }
    ];

    const user = mockUsers.find(u => 
      (u.email.toLowerCase() === loginData.email.toLowerCase() || 
       u.username?.toLowerCase() === loginData.email.toLowerCase()) && 
      u.password === loginData.password
    );

    if (user && user.isActive) {
      const mockResponse: AuthResponse = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          mobile: user.mobile,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          createdAt: user.createdAt
        },
        token: 'mock-jwt-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        expiresIn: 3600
      };

      this.saveAuthData(mockResponse.token, mockResponse.refreshToken, mockResponse.user);
      this.setupSessionTimeout();
      this.toastr.success('Login successful! (Demo Mode)', 'Success');
      
      return of(mockResponse);
    } else if (user && !user.isActive) {
      this.toastr.error('Your account has been deactivated. Please contact support.', 'Account Deactivated');
      return throwError(() => new Error('Account deactivated'));
    } else {
      this.toastr.error('Invalid email/username or password. Please try again.', 'Login Failed');
      return throwError(() => new Error('Invalid credentials'));
    }
  }

  /**
   * Get current user value
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Save login form data to localStorage
   */
  saveLoginData(formData: Partial<LoginData>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const existingData = this.getLoginData();
    const updatedData = { ...existingData, ...formData };
    localStorage.setItem(this.LOGIN_DATA_KEY, JSON.stringify(updatedData));
  }

  /**
   * Get saved login data
   */
  getLoginData(): Partial<LoginData> {
    if (!isPlatformBrowser(this.platformId)) return {};
    
    const data = localStorage.getItem(this.LOGIN_DATA_KEY);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Clear saved login data
   */
  clearLoginData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    localStorage.removeItem(this.LOGIN_DATA_KEY);
  }

  /**
   * Forgot password
   */
  forgotPassword(forgotPasswordData: ForgotPasswordData): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/forgot-password`, forgotPasswordData).pipe(
      tap(() => {
        // Success message handled in component for security reasons
      }),
      catchError(error => {
        if (error.status === 0) {
          return this.simulateForgotPassword(forgotPasswordData);
        }
        return this.handleError('Forgot Password')(error);
      })
    );
  }

  /**
   * Simulate forgot password for demo purposes
   */
  private simulateForgotPassword(forgotPasswordData: ForgotPasswordData): Observable<any> {
    const mockUsers = [
      {
        id: '1',
        fullName: 'Admin User',
        email: 'admin@example.com',
        username: 'admin',
        mobile: '+1234567890',
        role: 'admin',
        password: 'admin123',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        fullName: 'John Doe',
        email: 'user@example.com',
        username: 'johndoe',
        mobile: '+0987654321',
        role: 'user',
        password: 'user123',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        username: 'janesmith',
        mobile: '+1122334455',
        role: 'user',
        password: 'password123',
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        fullName: 'Dev User',
        email: 'dev5588@gmail.com',
        username: 'dev5588',
        mobile: '+1234567890',
        role: 'user',
        password: 'Dev@2006',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date().toISOString()
      }
    ];

    const user = mockUsers.find(u => 
      u.email.toLowerCase() === forgotPasswordData.email.toLowerCase()
    );

    // For security reasons, we always return success regardless of whether user exists
    const mockResponse = {
      message: 'If an account with this email exists, a password reset link has been sent.',
      timestamp: new Date().toISOString(),
      email: forgotPasswordData.email
    };

    return of(mockResponse);
  }

  /**
   * Save forgot password form data
   */
  saveForgotPasswordData(formData: Partial<ForgotPasswordData>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const existingData = this.getForgotPasswordData();
    const updatedData = { ...existingData, ...formData };
    localStorage.setItem(this.FORGOT_PASSWORD_DATA_KEY, JSON.stringify(updatedData));
  }

  /**
   * Get saved forgot password data
   */
  getForgotPasswordData(): Partial<ForgotPasswordData> {
    if (!isPlatformBrowser(this.platformId)) return {};
    
    const data = localStorage.getItem(this.FORGOT_PASSWORD_DATA_KEY);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Clear saved forgot password data
   */
  clearForgotPasswordData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    localStorage.removeItem(this.FORGOT_PASSWORD_DATA_KEY);
  }

  /**
   * Register a new user
   */
  register(userData: RegistrationData): Observable<User> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, userData).pipe(
      tap(({ user, token, refreshToken }) => {
        this.saveAuthData(token, refreshToken, user);
        this.clearRegistrationData();
        this.toastr.success('Registration successful! Welcome to our platform!', 'Success');
        this.router.navigate(['/dashboard']);
      }),
      map(response => response.user),
      catchError(this.handleError('Registration'))
    );
  }

  /**
   * Save registration form data
   */
  saveRegistrationData(formData: Partial<RegistrationData>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const existingData = this.getRegistrationData();
    const updatedData = { ...existingData, ...formData };
    localStorage.setItem(this.REGISTRATION_DATA_KEY, JSON.stringify(updatedData));
  }

  /**
   * Get saved registration data
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
   * Change user password
   */
  changePassword(changePasswordData: ChangePasswordData): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/change-password`, {
      currentPassword: changePasswordData.currentPassword,
      newPassword: changePasswordData.newPassword
    }).pipe(
      tap(() => {
        this.toastr.success('Password updated successfully!', 'Password Changed');
      }),
      catchError(this.handleError('Change Password'))
    );
  }

  /**
   * Save change password form data
   */
  saveChangePasswordData(formData: Partial<ChangePasswordData>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const existingData = this.getChangePasswordData();
    const updatedData = { ...existingData, ...formData };
    localStorage.setItem(this.CHANGE_PASSWORD_DATA_KEY, JSON.stringify(updatedData));
  }

  /**
   * Get saved change password data
   */
  getChangePasswordData(): Partial<ChangePasswordData> {
    if (!isPlatformBrowser(this.platformId)) return {};
    
    const data = localStorage.getItem(this.CHANGE_PASSWORD_DATA_KEY);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Clear saved change password data
   */
  clearChangePasswordData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    localStorage.removeItem(this.CHANGE_PASSWORD_DATA_KEY);
  }

  /**
   * Refresh access token
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
   * Save authentication data to localStorage and update current user
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
   * Get current user from localStorage
   */
  private getUserFromStorage(): User | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    
    const userData = localStorage.getItem(this.USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
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
   * Logout user
   */
  logout(): void {
    this.clearSessionTimeouts();
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.AUTH_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_DATA_KEY);
      localStorage.removeItem(this.SESSION_TIMEOUT_KEY);
      localStorage.removeItem(this.WARNING_TIMEOUT_KEY);
    }
    this.clearRegistrationData();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
    this.toastr.info('You have been logged out successfully.', 'Logged Out');
  }

  /**
   * Initialize session timeout management
   */
  private initializeSessionTimeout(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const token = this.getToken();
    if (token) {
      this.setupSessionTimeout();
    }
  }

  /**
   * Setup session timeout warnings
   */
  private setupSessionTimeout(): void {
    this.clearSessionTimeouts();
    
    // Show warning 5 minutes before session expires
    this.warningTimeoutTimer = setTimeout(() => {
      this.showSessionWarning();
    }, 55 * 60 * 1000); // 55 minutes

    // Auto-logout after 60 minutes
    this.sessionTimeoutTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, 60 * 60 * 1000); // 60 minutes
  }

  /**
   * Clear session timeout timers
   */
  private clearSessionTimeouts(): void {
    if (this.sessionTimeoutTimer) {
      clearTimeout(this.sessionTimeoutTimer);
      this.sessionTimeoutTimer = null;
    }
    if (this.warningTimeoutTimer) {
      clearTimeout(this.warningTimeoutTimer);
      this.warningTimeoutTimer = null;
    }
  }

  /**
   * Show session timeout warning
   */
  private showSessionWarning(): void {
    this.toastr.warning(
      'Your session will expire in 5 minutes. Please save your work.',
      'Session Expiring Soon',
      {
        timeOut: 10000,
        extendedTimeOut: 5000,
        tapToDismiss: true
      }
    );
  }

  /**
   * Handle session timeout
   */
  private handleSessionTimeout(): void {
    this.toastr.error(
      'Your session has expired due to inactivity. Please log in again.',
      'Session Expired'
    );
    this.logout();
  }

  /**
   * Reset session timeout (call this on user activity)
   */
  resetSessionTimeout(): void {
    if (this.isAuthenticated()) {
      this.setupSessionTimeout();
    }
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
          this.logout();
        }
      }
      
      this.toastr.error(errorMessage, `${operation} Failed`);
      return throwError(() => new Error(errorMessage));
    };
  }
}
