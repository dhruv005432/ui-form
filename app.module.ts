import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { APP_ID, CUSTOM_ELEMENTS_SCHEMA, Inject, NgModule, PLATFORM_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { NotFoundComponent } from './shared/not-found/not-found.component';

@NgModule({
  declarations: [
    AppComponent,
    NotFoundComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    ToastrModule.forRoot({
        timeOut: 5000,
        positionClass: 'toast-top-right',
        preventDuplicates: true,
        progressBar: true
    }),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule
],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()),
    UserService,
    AuthService
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { 
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(APP_ID) private appId: string
  ) {
    if (isPlatformBrowser(platformId)) {
      // Only initialize AOS in the browser
      import('aos').then(aos => {
        aos.init({
          duration: 800,
          easing: 'ease-in-out',
          once: true,
          mirror: false
        });
      });
    }
  }
}
