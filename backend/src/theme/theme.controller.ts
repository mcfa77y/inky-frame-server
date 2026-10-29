import { Body, Controller, Get, Post } from '@nestjs/common';
import { Theme, ThemeService } from './theme.service';

class CreateThemeDto {
  name: string;
  gradient: string | null;
  noise: number;
  shadow_x?: number;
  shadow_y?: number;
  shadow_blur?: number;
  shadow_opacity?: number;
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
    return this.themeService.saveTheme(
      body.name,
      body.gradient,
      body.noise,
      body.shadow_x,
      body.shadow_y,
      body.shadow_blur,
      body.shadow_opacity,
    );
  }
}
