import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

//http://api.weatherstack.com/current?access_key=df65b51017e9178c96f6e6820467cfb0&query=

  getWeather(location: string){
    return this.http.get(
      'http://localhost:3000/weather?location=' + location 
    );
}
}
