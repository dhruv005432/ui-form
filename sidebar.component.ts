import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  isCollapsed = false;
  activeItem = 'dashboard';

  constructor(private router: Router) {}

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  setActiveItem(item: string): void {
    this.activeItem = item;
  }

  logout(): void {
    // Clear any stored authentication data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberMe');
    
    // Navigate to login page
    this.router.navigate(['/login']);
  }
}
