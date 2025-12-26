import { Routes } from '@angular/router';

/* Pages */
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { HomeComponent } from './pages/home/home.component';

/* Auth */
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

/* Dashboards */
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';
import { UserDashboardComponent } from './dashboard/user-dashboard/user-dashboard.component';

/* Auth Guards */
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

/* Forms */
import { ChangePasswordComponent } from './forms/change-password/change-password.component';
import { ProfileFormComponent } from './forms/profile-form/profile-form.component';

export const routes: Routes = [

  /* Default Route */
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  /* Pages */
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },

  /* Auth */
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'auth/forgot-password', component: ForgotPasswordComponent },

  /* Help Routes */
  { path: 'faq', component: HomeComponent }, // Temporary - redirect to home
  { path: 'help', component: HomeComponent }, // Temporary - redirect to home

  /* Dashboards */
  { path: 'user-dashboard', component: UserDashboardComponent, canActivate: [authGuard] },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [adminGuard] },

  /* Forms */
  { path: 'profile', component: ProfileFormComponent, canActivate: [authGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },

  /* Wildcard (404) */
  { path: '**', redirectTo: 'home', pathMatch: 'full' }
];
