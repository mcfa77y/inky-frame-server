import { Controller, Get, Post, Body } from '@nestjs/common';
import { ThemeService, Theme } from './theme.service';

class CreateThemeDto {
  name: string;
  gradient: string | null;
  noise: number;
}

@Controller('themes')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  async getThemes(): Promise<Theme[]> {
    return this.themeService.getThemes();
  }

  @Post()
  async saveTheme(@Body() body: CreateThemeDto): Promise<Theme> {
    return this.themeService.saveTheme(body.name, body.gradient, body.noise);
  }
}
