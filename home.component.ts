import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private isBrowser: boolean;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Initialize AOS if available and in browser
    if (this.isBrowser && typeof (window as any).AOS !== 'undefined') {
      (window as any).AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100
      });
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToDashboard(): void {
    // Check if user is logged in and redirect accordingly
    if (this.isBrowser) {
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'admin') {
        this.router.navigate(['/admin-dashboard']);
      } else if (userRole === 'user') {
        this.router.navigate(['/user-dashboard']);
      } else {
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  isLoggedIn(): boolean {
    return this.isBrowser ? localStorage.getItem('token') !== null : false;
  }

  getUserRole(): string {
    return this.isBrowser ? localStorage.getItem('userRole') || '' : '';
  }
}