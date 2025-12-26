import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import AOS from 'aos';
import { AppModule } from './app/app.module';

AOS.init({
  duration: 800,
  easing: 'ease-in-out',
  once: true,
  offset: 100
});

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch((err: any) => console.error(err));
