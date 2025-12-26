import { Component, OnInit } from '@angular/core';
import { AuthService, LoginData } from '../../services/auth.service';

@Component({
  selector: 'app-login-demo',
  template: `
    <div class="demo-container">
      <h2>Login Demo Test</h2>
      <div class="test-results">
        <h3>Mock Users Available:</h3>
        <ul>
          <li><strong>Admin:</strong> email: admin@example.com, username: admin, password: admin123</li>
          <li><strong>User 1:</strong> email: user@example.com, username: johndoe, password: user123</li>
          <li><strong>User 2:</strong> email: jane@example.com, username: janesmith, password: password123</li>
        </ul>
        
        <button (click)="testAdminLogin()" class="test-btn">Test Admin Login</button>
        <button (click)="testUserLogin()" class="test-btn">Test User Login</button>
        <button (click)="testInvalidLogin()" class="test-btn">Test Invalid Login</button>
        <button (click)="testUsernameLogin()" class="test-btn">Test Username Login</button>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      max-width: 600px;
      margin: 20px auto;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .test-results {
      margin-top: 20px;
    }
    .test-btn {
      margin: 5px;
      padding: 10px 15px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .test-btn:hover {
      background: #0056b3;
    }
    ul {
      background: white;
      padding: 15px;
      border-radius: 4px;
      margin: 10px 0;
    }
    li {
      margin: 5px 0;
    }
  `]
})
export class LoginDemoComponent implements OnInit {

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    console.log('Login Demo Component initialized');
  }

  testAdminLogin(): void {
    console.log('Testing admin login...');
    const loginData: LoginData = {
      email: 'admin@example.com',
      password: 'admin123'
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Admin login successful:', response);
        alert('Admin login successful! User role: ' + response.user.role);
      },
      error: (error) => {
        console.error('Admin login failed:', error);
        alert('Admin login failed: ' + error.message);
      }
    });
  }

  testUserLogin(): void {
    console.log('Testing user login...');
    const loginData: LoginData = {
      email: 'user@example.com',
      password: 'user123'
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('User login successful:', response);
        alert('User login successful! User role: ' + response.user.role);
      },
      error: (error) => {
        console.error('User login failed:', error);
        alert('User login failed: ' + error.message);
      }
    });
  }

  testInvalidLogin(): void {
    console.log('Testing invalid login...');
    const loginData: LoginData = {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Invalid login unexpectedly successful:', response);
        alert('Invalid login unexpectedly successful!');
      },
      error: (error) => {
        console.log('Invalid login correctly failed:', error);
        alert('Invalid login correctly failed: ' + error.message);
      }
    });
  }

  testUsernameLogin(): void {
    console.log('Testing username login...');
    const loginData: LoginData = {
      email: 'johndoe', // Using username instead of email
      password: 'user123'
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Username login successful:', response);
        alert('Username login successful! User: ' + response.user.fullName);
      },
      error: (error) => {
        console.error('Username login failed:', error);
        alert('Username login failed: ' + error.message);
      }
    });
  }
}
