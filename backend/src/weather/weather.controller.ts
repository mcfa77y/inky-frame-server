import { Controller, Get, Query, Res, Header } from '@nestjs/common';
import type { Response } from 'express';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getWeather(@Query('zip') zip?: string) {
    return this.weatherService.getWeather(zip);
  }

  @Get('image')
  @Header('Content-Type', 'image/png')
  async getWeatherImage(@Query('zip') zip: string, @Res() res: Response) {
    const buffer = await this.weatherService.captureImage(zip);
    res.end(buffer);
  }
}
