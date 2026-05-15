import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as puppeteer from 'puppeteer';

@Injectable()
export class WeatherService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
  private readonly frontendUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('OPENWEATHER_API_KEY');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  async captureImage(zip: string = '94110'): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 800, height: 480 });
      
      // Navigate to the snapshot route on the frontend
      const url = `${this.frontendUrl}/snapshot?zip=${zip}`;
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Wait for the widget to be visible (it has a specific width/height)
      await page.waitForSelector('.w-\\[800px\\]');

      // Add a small delay for animations or gradients to settle
      await new Promise(r => setTimeout(r, 500));

      const screenshot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: 800, height: 480 }
      });

      return screenshot as Buffer;
    } finally {
      await browser.close();
    }
  }

  async getWeather(zip: string = '94110') {
    if (!this.apiKey) {
      // For demonstration if no API key is provided, we can return a mock or throw
      // In a real app, you'd want a valid key.
      return {
        zip,
        weather: 'Cloudy (Mock)',
        temp: 65,
        unit: 'F',
        message: 'Please provide OPENWEATHER_API_KEY in .env for real data',
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            zip: `${zip},us`,
            appid: this.apiKey,
            units: 'imperial',
          },
        }),
      );
      console.log(`[weather] ${JSON.stringify(response.data, null, 2)}`)
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch weather: ${error.message}`);
    }
  }
}
