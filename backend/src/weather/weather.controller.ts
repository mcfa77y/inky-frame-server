import { Controller, Get, Query, Res, Header } from '@nestjs/common';
import type { Response } from 'express';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getWeather(
    @Query('zip') zip?: string,
    @Query('view') view: string = 'current',
  ) {
    return this.weatherService.getWeather(zip, view);
  }

  @Get('image')
  @Header('Content-Type', 'image/png')
  async getWeatherImage(
    @Query('zip') zip: string,
    @Query('view') view: string = 'current',
    @Query('gradient') gradient?: string,
    @Query('noise') noise?: string,
    @Res() res: Response,
  ) {
    console.log(`zip: ${zip}`);
    console.log(`view: ${view}`);
    console.log(`gradient: ${gradient}`);
    console.log(`noise: ${noise}`);
    const noiseNum = noise !== undefined ? parseFloat(noise) : undefined;
    const buffer = await this.weatherService.captureImage(
      zip,
      view,
      gradient,
      isNaN(noiseNum as number) ? undefined : noiseNum,
    );
    res.end(buffer);
  }
}
