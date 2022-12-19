import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  isLoading = false;

  /** Show spinner */
  showSpinner(): void {
    this.isLoading = true;
  }

  /** Hide spinner */
  hideSpinner(): void {
    this.isLoading = false;
  }
}
