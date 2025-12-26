import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      // Check if user exists and has admin role
      if (user && user.role === 'admin') {
        return true;
      } else if (user) {
        // User exists but not admin - show access denied
        toastr.error('Access denied. Admin privileges required.', 'Unauthorized');
        router.navigate(['/user-dashboard']); // Redirect to regular user dashboard
        return false;
      } else {
        // User not authenticated - redirect to login
        toastr.warning('Please log in to access this page.', 'Authentication Required');
        router.navigate(['/login'], { 
          queryParams: { returnUrl: state.url } 
        });
        return false;
      }
    })
  );
};
