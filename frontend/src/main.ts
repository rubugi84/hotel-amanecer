import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(isoWeek);
dayjs.extend(utc);
dayjs.extend(customParseFormat);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
